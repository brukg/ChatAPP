import React from 'react';
import './ModelSelector.scss';

const ModelSelector = ({ currentModel, onModelChange }) => {
  return (
    <div className="model-selector">
    {/* <div className="model-selector" style={{display: 'none'}}> */}
      <select 
        value={currentModel} z
        onChange={(e) => onModelChange(e.target.value)}
      >
        <option value="deepseek_T">ትግርኛ</option>
        <option value="deepseek_A">ኣማርኛ</option>
        <option value="deepseek_E">English</option>
        {/* <option value="openai">English</option> */}
      </select>
    </div>
  );
};

export default ModelSelector; 