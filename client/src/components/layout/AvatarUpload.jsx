import React, { useRef, useState } from 'react';
import './AvatarUpload.css';

/**
 * AvatarUpload
 * Props:
 *  - currentAvatar: existing URL (or null)
 *  - name: display name for fallback UI avatar API
 *  - onAvatarChange: (base64String | null) => void
 */
const AvatarUpload = ({ currentAvatar, name = '', onAvatarChange }) => {
  const [preview, setPreview] = useState(currentAvatar || null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=6A5ACD&color=fff&size=128`;

  const processFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, JPEG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setPreview(base64);
      onAvatarChange(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleRemove = () => {
    setPreview(null);
    onAvatarChange(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="avatar-upload-wrapper">
      <div
        className={`avatar-drop-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <div className="avatar-preview-ring">
          <img
            src={preview || fallback}
            alt="Avatar"
            className="avatar-preview-img"
            onError={(e) => { e.target.src = fallback; }}
          />
          <div className="avatar-overlay">
            <span className="avatar-camera-icon">📷</span>
            <span>Change Photo</span>
          </div>
        </div>
      </div>

      <div className="avatar-upload-actions">
        <button type="button" className="avatar-btn-upload" onClick={() => fileRef.current?.click()}>
          Upload Photo
        </button>
        {preview && preview !== currentAvatar && (
          <button type="button" className="avatar-btn-remove" onClick={handleRemove}>
            Remove
          </button>
        )}
      </div>

      <p className="avatar-hint">PNG, JPG, WebP · Max 5 MB</p>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpg,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default AvatarUpload;
