import Login from "./pages/Login";
import AppRouter from "./routes/AppRouter";
import GlobalSpinner from "./components/GlobalSpinner";

function App() {
  return (
    <>
      <AppRouter />
      <GlobalSpinner />
    </>
  );
}

export default App;