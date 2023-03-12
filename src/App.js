import React, { useState } from 'react';
import axios from 'axios';
import ReactGA from "react-ga4";

import './App.css';

ReactGA.initialize(`${process.env.REACT_APP_GA_TRACKING_ID}}`);

const Child = (props) => {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  
  const handleChange = (event) => {
    setPrompt(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${props.API_key}`
      }
    }
    const data = {
      prompt: prompt,
      model: 'text-curie-001',
      temperature: 0,
      max_tokens: 400,
    }
    const url = 'https://api.openai.com/v1/completions'
    axios.post(url, data, config)
      .then((response) => {
        const data = response.data;
        const llm_result = data.choices[0].text;
        setResult(llm_result);
        props.res(llm_result);
        ReactGA.event({
          category: "OPENAI_API_CALLED",
          action: "BUTTON_CLICKED_OPENAI"
        });
      })
      .catch((error) => {
        console.log(error);
      });
      console.log('DONE');
  };

  const handlePrev = (event) => {
    event.preventDefault();
    setPrompt(prompt + props.prev);
  }

  return (<div className="llmbox">
    <h1>LLM Call {props.number + 1}</h1>
    <form onSubmit={handleSubmit}>
      <label>
        <h2>Prompt:</h2>
        <textarea name="prompt" value={prompt} onChange={handleChange} />
      </label>
      
      <button id="prev" onClick={handlePrev}>Insert Most Recent Output</button>
      <input type="submit" value="Submit" />
    </form>
    <div>
      <h2>Result</h2>
      <p className="res">{result === "" ? "Waiting for result..." : result}</p>
    </div>
    <h2>Latest output: </h2>
    <p className="res">{props.prev === "" ? "No calls have been executed." : props.prev}</p>

  </div>);
}

const Parent = (props) => {
  return (
    <div>
      <div className="controller-container">
        <button className={["add", "controller"].join(' ')} onClick={props.addFn}>Add LLM Call</button>
        <button className={["remove", "controller"].join(' ')} onClick={props.remFn}>Remove LLM Call</button>
        
      </div>
      <div>
        {props.children}
      </div>
    </div>
  );
}

const App = () => {
  const [numChildren, setNumChildren] = useState(1);
  const [lastResult, setLastResult] = useState("");
  const [API_key , setAPI_key] = useState("");

  const handleKeyChange = (event) => {
    setAPI_key(event.target.value);
  };

  const addLlmBox = (event) => {
    setNumChildren(numChildren + 1);
  }

  const remLlmBox = (event) => {
    if (numChildren <= 1) return;
    setNumChildren(numChildren - 1);
  }

  let children = [];

  for (var i = 0; i < numChildren; i += 1) {
    children.push(<Child key={i} number={i} prev={lastResult} res={setLastResult}  API_key={API_key} />);
  };

  ReactGA.send({ hitType: "pageview", page: "/prompt-lab", title: "v1-j-s-pb" });

  return (
    <div>
    <div className="api_key">
      <label>
        <h2>OpenAI API Key:</h2>
        <input name="apikey" value={API_key} onChange={handleKeyChange} />
      </label>
    </div>
    <Parent addFn={addLlmBox} remFn={remLlmBox} >
      {children}
    </Parent>
    </div>
  );
}

export default App;
