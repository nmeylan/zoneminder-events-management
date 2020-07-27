import Head from 'next/head'
import './reboot.css';
import './utility.css';
import './main.css';
import {library} from '@fortawesome/fontawesome-svg-core'
import {faArrowLeft, faTrash, faImage, faVideo, faFilm, faCalendarAlt, faExclamationTriangle, faClock} from '@fortawesome/free-solid-svg-icons'

library.add(faArrowLeft, faTrash, faImage, faVideo, faFilm, faExclamationTriangle, faCalendarAlt, faClock)

export default function MyApp({Component, pageProps}) {
  return (<>
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    </Head>
    <Component {...pageProps} />
  </>)
}