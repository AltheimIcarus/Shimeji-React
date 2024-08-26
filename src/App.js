import logo from './logo.svg';
import './App.css';
import Shimeji from './Shimeji';

function App() {
  // main function to remove a Shimeji at top level
  const removeShimeji = (id) => {
    console.log('rm:', id);
  };

  // main function to duplicate a Shimeji at top level
  const duplicateShimeji = (id) => {
    console.log('dup:', id);
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <body>
        <Shimeji
          id={1}
          remove={removeShimeji}
          duplicate={duplicateShimeji}
        />
      </body>
    </div>
  );
}

export default App;
