import { useState } from 'react'
import { processText } from './api/api'
import './App.css'

function App() {
  // State to hold the user's input and the result from the backend.
  const [inputText, setInputText] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  // This function runs when the "Translate" button is clicked.
  const handleTranslate = async () => {
    if (!inputText) return;

    setLoading(true);
    try {
      // Call our API helper to get the translation.
      const data = await processText(inputText);
      setResult(data);
    } catch (error) {
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>SignFusion v1.0</h1>

      {/* Input Section */}
      <div className="input-section">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type something here (e.g., 'I am happy today')..."
          rows="4"
        />
        <br />
        <button onClick={handleTranslate} disabled={loading}>
          {loading ? "Translating..." : "Translate to ASL"}
        </button>
      </div>

      {/* Output Section - Only shows if we have a result */}
      {result && (
        <div className="output-section">
          <h3>Original: {result.original}</h3>

          <div className="result-box">
            <h4>ASL Gloss Tokens:</h4>
            <div className="tokens">
              {result.gloss.map((token, index) => (
                <span key={index} className="token">{token}</span>
              ))}
            </div>

            <h4>Emotion ID:</h4>
            <p className="emotion">{result.emotion}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
