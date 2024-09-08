import logo from './logo.svg';
import './App.css';
import Shimeji from './Shimeji';

function App() {
  // main function to remove a Shimeji at top level
  const removeShimeji = (id) => {
    console.log('rm:', id);
  };

  // main function to duplicate a Shimeji at top level
  // const duplicateShimeji = (id) => {
  //   console.log('dup:', id);
  // };

  return (
    <div className="App">
      <Shimeji
        id={1}
        remove={removeShimeji}
        // duplicate={duplicateShimeji}
      />
    </div>
  );
}

export default App;
