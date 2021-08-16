import { Pane } from 'evergreen-ui';
import { Router } from '@reach/router';
import Home from './pages/Home';
import Error404 from './pages/Error404';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ReCaptchaProvider } from 'react-recaptcha-x';
import { Provider as BusProvider } from 'react-bus';

export default function App() {
    return (
        <ReCaptchaProvider siteKeyV2={process.env.REACT_APP_RECAPTCHA_V2_KEY} langCode='ru' hideV3Badge={true}>
            <BusProvider>
                <Pane height='100vh' display='flex' flexDirection='column'>
                    <Router height='100%' style={{ flex: 1, display: 'flex' }}>
                        <Home path='/' />
                        <Error404 default />
                    </Router>
                </Pane >
            </BusProvider>
        </ReCaptchaProvider>
    );
}
