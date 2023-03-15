import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-responsive-modal/styles.css';
import { Modal } from 'react-responsive-modal';


import axios from 'axios';
import posthog from 'posthog-js'
import TextareaAutosize from 'react-textarea-autosize';
import './App.css';

posthog.init(`${process.env.REACT_APP_POSTHOG_ID}`, { api_host: 'https://app.posthog.com' });

const Child = (props) => {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [callIsLoading, setCallIsLoading] = useState(false);
  const handleChange = (event) => {
    setPrompt(event.target.value);
  };

  const displayInvalidKeyToast = () => {
    toast.error('Please input a valid OpenAI API key.', {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
  }

  const askForEmail = () => {
    props.setIsRodalVisible(true);
  }

  const handleSubmit = async (event) => {
    setCallIsLoading(true);
    event.preventDefault();
    posthog.capture('open_ai_call', { "prompt": prompt, "box_number": props.number+1 });
    if(props.API_key === '') {
      displayInvalidKeyToast();
      posthog.capture('empty_api_key');
    }
    else{
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${props.API_key}`
        }
      }
      const data = {
        prompt: prompt,
        model: 'text-curie-001',
        temperature: 0.8,
        max_tokens: 400,
      }
      const url = 'https://api.openai.com/v1/completions';
      axios.post(url, data, config)
        .then((response) => {
          // If this is second exec in first LLM call or LLM Call #2, ask for email
          if ((props.numCalls>=1 || props.number+1 >= 2) && !props.hasAskedForEmail) {
            props.setHasAskedForEmail(true);
            askForEmail();
          }
          const data = response.data;
          const llm_result = data.choices[0].text;
          setCallIsLoading(false);
          setResult(llm_result);
          props.res(llm_result);
        })
        .catch((error) => {
          displayInvalidKeyToast();
          posthog.capture('open_ai_error', { "error": error.toString() });
        });
        console.log('DONE');
      props.setNumCalls(props.numCalls + 1);
    }
  };

  const handlePrev = (event) => {
    event.preventDefault();
    setPrompt(prompt + props.prev);
  }


  return (<div className="llmbox">
    <h1>LLM Call #{props.number + 1}</h1>
    <form onSubmit={handleSubmit}>
      <label>
        <h2>Prompt:</h2>
        <TextareaAutosize className="textarea" name="prompt" value={prompt} onChange={handleChange} />
      </label>
      
      <button id="prev" onClick={handlePrev}><em>Append Most Recent Output</em></button>
      <input type="submit" value="Submit" />
    </form>
    <div>
      <h2>Result</h2>
      <p className="res">
        {callIsLoading ? "Loading..." : ""}
        {result ? result : ""}
      </p>
    </div>
    <h2>Most recent output: </h2>
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
  const [numCalls, setNumCalls] = useState(0);
  const [lastResult, setLastResult] = useState("");
  const [API_key , setAPI_key] = useState("");
  const [instructions, setInstructions] = useState(true);
  const [hasAskedForEmail, setHasAskedForEmail] = useState(false);
  const [isRodalVisible, setIsRodalVisible] = useState(false);
  const [email, setEmail] = useState("");


  const hideInstructions = (event) => {
    setInstructions(!instructions);
  }

  const handleKeyChange = (event) => {
    setAPI_key(event.target.value);
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  }

  const handleEmailSubmit = (event) => {
    event.preventDefault();
    console.log('Email submitted:', email)
    const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdxq6sfyh5E0yG94x7S1_gl9w2v17eBxafpt6cJWNxnHtD38A/formResponse';
    const formData = new FormData();
    formData.append('entry.2112444487', email);

    axios.post(formUrl, formData)
      .then((response) => {
        console.log('Email submitted successfully!');
      })
      .catch((error) => {
        console.error('Error submitting email:', error);
      });

    setIsRodalVisible(false);
    toast.success('Email submitted!', {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
    posthog.capture('email submitted', {'email': email});
  }

  const addLlmBox = (event) => {
    setNumChildren(numChildren + 1);
    posthog.capture('box_added', {'box_number': numChildren});
  }

  const remLlmBox = (event) => {
    if (numChildren <= 1) return;
    setNumChildren(numChildren - 1);
    posthog.capture('box_removed');
  }

  let children = [];

  for (var i = 0; i < numChildren; i += 1) {
    children.push(<Child key={i} number={i} prev={lastResult} res={setLastResult}  API_key={API_key} hasAskedForEmail={hasAskedForEmail} setHasAskedForEmail={setHasAskedForEmail} setIsRodalVisible={setIsRodalVisible} numCalls={numCalls} setNumCalls={setNumCalls}/>);
  };

  const onCloseModal = () => {
    setIsRodalVisible(false);
    posthog.capture('email modal closed', { 'email': email });
  }

  return (
    <div>
      <div id="contact">
        <a className="linkbox" href="https://github.com/interlocklabs/promptlab"><img className="icon" src="gh.png" />GitHub</a>
        <a className="linkbox" href="mailto:me+promptlab@shivan.sh"><img className="icon" src="us.png" />Contact Us</a>
      </div>
      <div className="bodyWrapper">
        <div className="api_key">
          <div id="instructions">
            <h2 onClick={hideInstructions}>Instructions <u>(click/tap to hide)</u></h2>
            <div id="instructions-content" style={{display: instructions ? "block" : "none"}}>
              <p>To use this tool:</p>
              <ol>
                <li>Get an API key from <em><a href="https://platform.openai.com/">OpenAI</a></em></li>
                <li>Enter your API key in the box below</li>
                <li>Fill out your first prompt in LLM Call #1</li>
                <li>Click submit to get the result from <code>text-curie-001 (temperature: 0.8, max_tokens: 400, everything else default)</code></li>
                <li>Note that the result of LLM Call #1 is now stored; click "Add LLM Call"</li>
                <li>Write a new prompt in LLM Call #2, inserting the results of your previous call wherever relevant with the button.</li>
                <li>Iterate as necessary, adding and removing LLM calls as required!</li>
              </ol>
            </div>
          </div>
          <label>
            <h2>OpenAI API Key:</h2>
            <input className="ph-no-capture" name="apikey" value={API_key} onChange={handleKeyChange} />
          </label>
        </div>
        <Parent addFn={addLlmBox} remFn={remLlmBox} >
          {children}
        </Parent>
      </div>

      <Modal open={isRodalVisible} onClose={onCloseModal} center>
        <h2>Can we get your feedback?</h2>
        <form onSubmit={handleEmailSubmit}>
          <label>
            <p>Hey! We noticed you're liking the app. Could we email you and ask for your feedback? Please leave your email if so: </p>
            <input placeholder="your@email.com" name="email" value={email} onChange={handleEmailChange} />
          </label>

          <input type="submit" name="emailSubmit" value="Submit" />
        </form>
      </Modal>

      <ToastContainer />
    </div>
  );
}

export default App;
