import React, { useEffect, useRef, useState } from 'react';
import '../style/AgentAside.css';

function Agentaside() {
  const [panelWidthVw, setPanelWidthVw] = useState(24); // 默认约24vw
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(24);

  const [messages, setMessages] = useState([]); // {role:'user'|'assistant', content:string}
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (!content || loading) return;

    const userMsg = { role: 'user', content };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputValue('');
    setLoading(true);

    try {
      const resp = await fetch('http://127.0.0.1:9000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextHistory })
      });
      const data = await resp.json();
      const reply = data?.content || data?.message || '抱歉，我没有理解您的问题。';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '服务暂不可用，请稍后重试。' }]);
    } finally {
      setLoading(false);
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

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">开始您的对话吧！</div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <div className="msg-content">{m.content}</div>
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
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading || !inputValue.trim()}>
            {loading ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Agentaside;
