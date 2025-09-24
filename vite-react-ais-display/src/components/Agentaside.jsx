import React, { useState } from 'react';
import '../style/AgentAside.css';
import useRequest from '../hooks/useRequest.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'github-markdown-css/github-markdown.css';
import 'highlight.js/styles/github.css';
import AgentHeader from './AgentHeader.jsx';
import AgentDocument from './AgentDocument.jsx';
import AgentUpload from './AgentUpload.jsx';
import AgentSetting from './AgentSetting.jsx';
import AgentGeoJsonInput from './AgentGeoJsonInput.jsx';

function Agentaside() {
  const [activeTab, setActiveTab] = useState('chat'); // 当前选中的标签页
  const [messages, setMessages] = useState([]); // {role:'user'|'assistant', content:string, loading?:boolean, markdown?:boolean}
  const [inputValue, setInputValue] = useState('');

  const { isLoading, error, doFetch } = useRequest({
    url: 'http://127.0.0.1:9000/ask',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    lazy: true,
  });


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

  // 渲染聊天页面
  const renderChatPage = () => (
    <>
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
    </>
  );


  // 根据当前标签页渲染内容
  const renderPageContent = () => {
    switch (activeTab) {
      case 'chat':
        return renderChatPage();
      case 'geojson':
        return <AgentGeoJsonInput />;
      case 'upload':
        return <AgentUpload />;
      case 'settings':
        return <AgentSetting />;
      default:
        return renderChatPage();
    }
  };

  return (
    <aside className="chat-panel">
      <div className="chat-body">
        <AgentHeader 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        
        {renderPageContent()}
      </div>
    </aside>
  );
}

export default Agentaside;
