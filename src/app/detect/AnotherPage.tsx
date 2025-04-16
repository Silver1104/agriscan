import { useLocation } from 'react-router-dom';

const AnotherPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const diseaseName = params.get('disease');

  return (
    <div>
      <h2>Disease Detected:</h2>
      <p>{diseaseName}</p>
    </div>
  );
};
