import React, { useState } from 'react';

const PasswordInput = ({ 
  name = 'password', 
  value, 
  onChange, 
  placeholder = '••••••••', 
  required = true,
  minLength = 8,
  className = ''
}) => {
  const [show, setShow] = useState(false);

  return (
    <div className={`pass-input-wrap ${className}`.trim()}>
      <input
        type={show ? 'text' : 'password'}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
      />
      <button 
        type="button" 
        className="pass-toggle" 
        onClick={() => setShow(!show)}
        tabIndex="-1"
        title={show ? "Hide password" : "Show password"}
      >
        {show ? '👁️' : '👁️‍🗨️'}
      </button>
    </div>
  );
};

export default PasswordInput;
