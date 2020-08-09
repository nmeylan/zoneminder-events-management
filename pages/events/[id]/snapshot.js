import {del, getJSON as get} from '../../../lib/Ajax';
import {useRouter} from 'next/router'
import Link from 'next/link'
import {useEffect, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import Head from "next/head";


const EventSnapshot = () => {
  const router = useRouter()
  const [event, setEvent] = useState(null)
  const {id} = router.query
  useEffect(() => {
    if (id) {
      get(`/api/events/${id}/snapshot`)
        .then(response => setEvent(response))
    }
  }, [id])

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
        <title>Zoneminder event {id} snapshot</title>
      </Head>
      <div className="actions-bar">
        <Link href="/">
          <button type="button" className="btn btn-outline-primary">
            <FontAwesomeIcon icon={["fa", "arrow-left"]}/>
            <span className="pl-2">Back to events</span>
          </button>
        </Link>
        <Link href="/events/[id]/stream" as={`/events/${id}/stream`}>
          <button type="button"
                  className="btn btn-outline-primary">
            <FontAwesomeIcon icon={["fa", "film"]}/>
            <span className="pl-1">View video</span>
          </button>
        </Link>
        <button type="button" className="btn btn-outline-primary" onClick={deleteEvent}>
          <FontAwesomeIcon icon={["fa", "trash"]}/>
          <span className="pl-2">Delete event</span>
        </button>
      </div>
      {event && (
        <img src={`data:image/jpeg;base64,${event.objdetect || event.snapshot}`}/>
      )}
    </>
  )
}

export default EventSnapshot;
