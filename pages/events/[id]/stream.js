import {del} from '../../../lib/Ajax';
import {useRouter} from 'next/router'
import Link from 'next/link'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import Head from "next/head";

const EventStream = () => {
  const router = useRouter()
  const {id} = router.query

  function deleteEvent() {
    const confirmed = confirm(`Are you sure you want to delete this event?`)
    if (confirmed) {
      del('/api/events/bulk-delete', {body: {events: [id]}}).then(() => {
        router.replace("/")
      })
    }
  }

  return (
    <>
      <Head>
        <title>Zoneminder event {id} video</title>
      </Head>
      <div className="actions-bar">
        <Link href="/">
          <button type="button" className="btn btn-outline-primary">
            <FontAwesomeIcon icon={["fa", "arrow-left"]}/>
            <span className="pl-2">Back to events</span>
          </button>
        </Link>
        <Link href="/events/[id]/snapshot" as={`/events/${id}/snapshot`}>
          <button type="button"
                  className="btn btn-outline-primary">
            <FontAwesomeIcon icon={["fa", "image"]}/>
            <span className="pl-1">View snapshot</span>
          </button>
        </Link>
        <button type="button" className="btn btn-outline-primary" onClick={deleteEvent}>
          <FontAwesomeIcon icon={["fa", "trash"]}/>
          <span className="pl-2">Delete event</span>
        </button>
      </div>
      {id && (
        <img src={`/api/events/${id}/stream`}/>
      )}

    </>
  )
}

export default EventStream;