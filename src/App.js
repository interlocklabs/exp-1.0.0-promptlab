import React, { useState } from 'react';
import axios, {isCancel, AxiosError} from 'axios';
import './App.css';

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
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
      }
    }
    const data = {
      prompt: prompt,
      model: 'text-davinci-003',
      temperature: 0,
      max_tokens: 10
    }
    const url = 'https://api.openai.com/v1/completions'
    axios.post(url, data, config)
      .then((response) => {
        const data = response.data;
        const llm_result = data.choices[0].text;
        setResult(llm_result);
        props.res(llm_result);
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
    <h2>Latest output: </h2>
    <p className="res">{props.prev === "" ? "Nothing" : props.prev}</p>
    <form onSubmit={handleSubmit}>
      <label>
        <h2>Prompt:</h2>
        <textarea name="prompt" value={prompt} onChange={handleChange} />
      </label>
      <button id="prev" onClick={handlePrev}>&lt;Insert Previous Output&gt;</button>
      <input type="submit" value="Submit" />
    </form>
    <div>
      <h2>Result</h2>
      <p className="res">{result === "" ? "Waiting for result" : result}</p>
    </div>

  </div>);
}

const Parent = (props) => {
  return (
    <div>
      <div>
        <button className="controller" onClick={props.addFn}>Add LLM Call</button>
        <button className="controller" onClick={props.remFn}>Remove LLM Call</button>
        
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
  
  const addLlmBox = (event) => {
    setNumChildren(numChildren + 1);
  }

  const remLlmBox = (event) => {
    if (numChildren <= 1) return;
    setNumChildren(numChildren - 1);
  }

  let children = [];

  for (var i = 0; i < numChildren; i += 1) {
    children.push(<Child key={i} number={i} prev={lastResult} res={setLastResult} />);
  };

  // setChildLiterals(children);

  return (
    <Parent addFn={addLlmBox} remFn={remLlmBox} >
      {children}
    </Parent>
  );
}

export default App;
