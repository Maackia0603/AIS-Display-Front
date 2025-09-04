import React, { useEffect, useRef, useState } from 'react';
import '../style/AgentAside.css';
import useRequest from '../hooks/useRequest.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'github-markdown-css/github-markdown.css';
import 'highlight.js/styles/github.css';

function Agentaside() {
  const [panelWidthVw, setPanelWidthVw] = useState(24); // 默认约24vw
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(24);

  const [messages, setMessages] = useState([]); // {role:'user'|'assistant', content:string, loading?:boolean, markdown?:boolean}
  const [inputValue, setInputValue] = useState('');

  const { isLoading, error, doFetch } = useRequest({
    url: 'http://127.0.0.1:9000/ask',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    lazy: true,
  });

  // 拖拽调整宽度
  const handleMouseDown = (e) => {
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = panelWidthVw;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const deltaX = startXRef.current - e.clientX; // 往左拖动为正值（面板变宽）
      const vw = Math.max(document.documentElement.clientWidth || window.innerWidth, 1);
      const deltaVw = (deltaX / vw) * 100;
      let next = startWidthRef.current + deltaVw;
      next = Math.max(15, Math.min(40, next)); // 限制 15vw - 40vw
      setPanelWidthVw(next);
    };
    const handleMouseUp = () => setIsResizing(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const sendMessage = async () => {
    const content = inputValue.trim();
    if (!content || isLoading) return;

    const userMsg = { role: 'user', content };
    // 先渲染用户消息与一个loading的assistant气泡
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '', loading: true }]);
    setInputValue('');

    try {
      const payload = await doFetch({
        body: JSON.stringify({ question: content })
      });
      const replyRaw = (payload && (payload.final || payload.content || payload.message || payload.answer))
        || (typeof payload === 'string' ? payload : '')
        || '抱歉，我没有理解您的问题。';
      // 替换最后一个loading assistant为最终内容（Markdown）
      setMessages(prev => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].role === 'assistant' && next[i].loading) {
            next[i] = { role: 'assistant', content: replyRaw, loading: false, markdown: true };
            break;
          }
        }
        return next;
      });
    } catch {
      setMessages(prev => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].role === 'assistant' && next[i].loading) {
            next[i] = { role: 'assistant', content: '服务暂不可用，请稍后重试。', loading: false };
            break;
          }
        }
        return next;
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <aside
      className="chat-panel"
      style={{ width: `${panelWidthVw}vw` }}
    >
      <div
        className="chat-resizer"
        onMouseDown={handleMouseDown}
        title="拖拽调整宽度"
      />

      <div className="chat-body">
        <div className="chat-header">调用MCP服务的TEXT2SQL项目</div>

        {!!error && (
          <div className="chat-empty" style={{ color: '#ff4d4f' }}>
            获取回复失败：{error.message || '未知错误'}
          </div>
        )}

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">开始您的对话吧！</div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role} ${m.loading ? 'loading' : ''}`}>
                {m.loading ? (
                  <div className="msg-content"><span className="dot dot1"></span><span className="dot dot2"></span><span className="dot dot3"></span></div>
                ) : m.markdown ? (
                  <div className="msg-content">
                    <div className="markdown-body">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="msg-content">{m.content}</div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="chat-input">
          <textarea
            placeholder="请输入你的问题📝"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button onClick={sendMessage} disabled={isLoading || !inputValue.trim()}>
            {isLoading ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Agentaside;
