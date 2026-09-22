import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/500.css';
import '@fontsource/source-sans-3/600.css';
import '@fontsource/source-sans-3/700.css';
import '@fontsource/newsreader/400.css';
import '@fontsource/newsreader/500.css';
import './styles/global.css';
class Boundary extends React.Component<{children:React.ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true}}render(){if(this.state.error)return <div style={{padding:40,fontFamily:'sans-serif'}}><h1>The lab could not display this screen.</h1><p>Your saved learning data has not been reset. Reload to recover it.</p><button onClick={()=>location.reload()}>Reload</button></div>;return this.props.children}}
ReactDOM.createRoot(document.getElementById('root')!).render(<Boundary><App/></Boundary>);
