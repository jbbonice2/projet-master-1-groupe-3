import React, { useState, useEffect } from 'react';
import axios from '@/app/axiosConfig';
import { useSelector } from 'react-redux';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import CryptoJS from 'crypto-js';

const Comments = ({ recordId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [user, setUserInfo] = useState(null);
  const [replyContent, setReplyContent] = useState({});
  const [showReplyInput, setShowReplyInput] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [collapsedReplies, setCollapsedReplies] = useState({});
  const userinf = useSelector((state) => state.auth.profile);
  const ENCRYPTION_KEY = 'your-encryption-key';

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      const decryptedData = CryptoJS.AES.decrypt(storedUserInfo, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
      const parsedData = JSON.parse(decryptedData);
      const users = userinf || parsedData;
      setUserInfo(users);
    } else setUserInfo(userinf);
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/comments/${recordId}/`);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    if (e.key === 'Enter' && newComment.trim()) {
      try {
        const response = await axios.post(`/comments/create/${recordId}/`, { content: newComment, user: user.email ? user.email : user.userEmail });
        setComments([...comments, response.data]);
        setNewComment('');
      } catch (error) {
        console.error('Failed to post comment:', error);
      }
    }
  };

  const handleReplySubmit = async (e, parentId) => {
    if (e.key === 'Enter' && replyContent[parentId]?.trim()) {
      try {
        const response = await axios.post(`/comments/create/${recordId}/`, { content: replyContent[parentId], parent: parentId, user: user.email ? user.email : user.userEmail });
        fetchComments(); // Refresh comments to include the new reply
        setReplyContent({ ...replyContent, [parentId]: '' });
        setShowReplyInput({ ...showReplyInput, [parentId]: false });
      } catch (error) {
        console.error('Failed to post reply:', error);
      }
    }
  };

  const handleReplyChange = (parentId, value) => {
    setReplyContent({ ...replyContent, [parentId]: value });
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleReplyInput = (parentId) => {
    setShowReplyInput({ ...showReplyInput, [parentId]: !showReplyInput[parentId] });
  };

  const toggleRepliesCollapse = (commentId) => {
    setCollapsedReplies({ ...collapsedReplies, [commentId]: !collapsedReplies[commentId] });
  };

  const renderComments = (commentList, parentId = null) => {
    return commentList.filter(comment => comment.parent === parentId).map(comment => (
      <div key={comment.id} style={{ marginLeft: parentId ? '20px' : '0px', marginBottom: '10px', alignItems: "center", width: "60%" }}>
        <div>
          <div className='btn_div' style={{ justifyContent: "flex-start", gap: "10px" }}>
            <img src={`http://localhost:8000${comment.user_inf.url_img}`} alt={comment.user_inf.username} style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
            <strong>{comment.user.username} {comment.user_inf.is_superuser ? '(admin)' : ''}</strong>{comment.user_inf.username}</div>
          <p style={{ padding: "10px", paddingLeft: "65px", }}>{comment.content}</p>
        </div>
        {comment.replies.length > 0 && (
          <div>
            <div className='btn_div' style={{justifyContent:"flex-start"}}>
              {comment.replies.length  && <Button 
                  style={{ margin: "0%", padding: "0%", marginLeft: "20%", marginRight: "1%", marginBottom:"" }}
                  className='button' label={collapsedReplies[comment.id] ? `Afficher reponses (${comment.replies.length})` : `Masquer reponses (${comment.replies.length})`} onClick={() => toggleRepliesCollapse(comment.id)} />}
              {!showReplyInput[comment.id] && <Button 
                    style={{ margin: "0%", padding: "0%", marginLeft: "20%", marginRight: "1%", position:"relative", top:"-10%" }}
                    icon="pi pi-reply" label="Répondre" className='button' onClick={() => toggleReplyInput(comment.id)} />}
          </div>
            {!collapsedReplies[comment.id] && comment.replies.map(replie => (
              <div style={{ paddingLeft: "20%" }} key={replie.id}>
                <div className='btn_div' style={{ justifyContent: "flex-start", gap: "10px" }}>
                  <img src={`http://localhost:8000${replie.user_inf.url_img}`} alt={replie.user_inf.username} style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                  <strong>{replie.user.username} {replie.user_inf.is_superuser ? '(admin)' : ''}</strong>{replie.user_inf.username}</div>
                <p style={{ padding: "10px", paddingLeft: "65px", paddingBottom:"2px" }}>{replie.content}</p>
              </div>
            ))}
          </div>
        )}
        {user && (
          <>
            {!showReplyInput[comment.id] && comment.replies.length === 0 && <Button 
          style={{ margin: "0%", padding: "0%", marginLeft: "20%", marginRight: "1%", position:"relative", top:"-10%" }}
          icon="pi pi-reply" label="Répondre" className='button' onClick={() => toggleReplyInput(comment.id)} />}
            {showReplyInput[comment.id] && (
              <InputTextarea
                type="text"
                className='input'
                placeholder="Reply..."
                style={{ margin: "10px", marginLeft: "65px", }}
                value={replyContent[comment.id] || ''}
                onChange={(e) => handleReplyChange(comment.id, e.target.value)}
                onKeyUp={(e) => handleReplySubmit(e, comment.id)}
              />
            )}
          </>
        )}
        {renderComments(comments, comment.id)}
      </div>
    ));
  };

  return (
    <div>
      {user && (
        <InputTextarea
          type="text"
          style={{ marginLeft: "40px", width: "90%", height: "100px", marginBottom:"20px" }}
          placeholder="Votre commentaire"
          className='input'
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleCommentSubmit}
        />
      )}
      {renderComments(comments.slice(0, 1))}
      {comments.length > 1 && (
        <button onClick={toggleCollapse}
          className='button'
          style={{ margin: "0%", padding: "0%", marginLeft: "1%", marginRight: "1%" }}
        >
          {isCollapsed ? 'Afficher tout  + ' + String(comments.length - 1) : 'Masquer commentaires'}
        </button>
      )}
      {!isCollapsed && <div style={{}}>{renderComments(comments.slice(1))}</div>}
    </div>
  );
};

export default Comments;
