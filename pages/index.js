import {getJSON as get, del} from '../lib/Ajax';
import {useEffect, useState} from "react";
import Link from "next/link";
import Head from 'next/head'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [selectedEventsCount, setSelectedEventsCount] = useState(0);
  useEffect(() => {
    get('/api/events')
      .then(response => setEvents(response.sort((x, y) => y.id - x.id)));
  }, []);

  function countSelectedEvent() {
    const count = document.querySelectorAll('[data-role=event-checkbox]:checked').length;
    setSelectedEventsCount(count);
  }

  function onSelectAllChange(e) {
    document.querySelectorAll('[data-role=event-checkbox]').forEach(checkbox => {
      checkbox.checked = e.target.checked;
    });
    countSelectedEvent();
  }

  function onSubmit(e) {
    e.preventDefault();
    const confirmed = confirm(`Are you sure you want to delete ${eventsLabel()}?`);
    if (confirmed) {
      const eventIds = Array.from(document.querySelectorAll('[data-role=event-checkbox]:checked')).map(checkbox => checkbox.dataset.id);
      del('/api/events/bulk-delete', {body: {events: eventIds}}).then(() => {
        setSelectedEventsCount(0)
        setEvents((events) => {
          return events.filter(event => !eventIds.includes(event.id))
        })
      })
    }
  }

  function logout() {
    del('/api/logout').then(() => {
      window.location.reload()
    })
  }

  function eventsLabel() {
    return eventsPlural(selectedEventsCount);
  }

  function eventsPlural(count) {
    return `${count} ${count > 1 ? 'events' : 'event'}`;
  }

  function duration(event) {
    const seconds = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 1000;
    return `${seconds} seconds`
  }

  function humanSize(size) {
    return `${(size / 1024.0 / 1024).toFixed(2)} mb`
  }

  return (
    <div id="page-events">
      <Head>
        <title>Zoneminder events</title>
      </Head>
      <form onSubmit={onSubmit}>
        <div className="actions-bar">
          <div>
            <label htmlFor="select-all">Select all events</label>
            <input type="checkbox" name="select-all" id="select-all" onChange={onSelectAllChange}/>
          </div>
          <div>
            {eventsPlural(events.length)} - {humanSize(events.reduce((memo, e) => memo + new Number(e.diskSpace), 0))}
          </div>
          <div>
            <button type="submit"
                    className="btn btn-primary"
                    disabled={selectedEventsCount === 0}>
              <FontAwesomeIcon icon={["fa", "trash"]}/>
              <span className="pl-2">Delete {eventsLabel()}</span>
            </button>
            <button type="button"
                    onClick={logout}
                    className="btn btn-outline-primary ml-2">
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="events-list">
          {events.map(event => (
              <div className="event" key={`event-${event.id}`}>
                <div className="card">
                  <div className="card-header">
                    <h3 title="event-id">
                      <input type="checkbox" name={`select-event-${event.id}`}
                             id={`checkbox-${event.id}`}
                             data-id={event.id} data-role="event-checkbox"
                             onClick={countSelectedEvent}/>
                      <label htmlFor={`checkbox-${event.id}`} className="pl-2">{event.id}</label>
                    </h3>
                    <h5 title="monitor id">
                      <FontAwesomeIcon icon={['fa', 'video']}/>
                      <span className="pl-2">{event.monitorId}</span>
                    </h5>
                    <p title="reason">
                      <FontAwesomeIcon icon={['fa', 'exclamation-triangle']}/>
                      <span className="pl-2">{event.notes}</span>
                    </p>
                    <p title="date">
                      <FontAwesomeIcon icon={['fa', 'calendar-alt']}/>
                      <span className="pl-2">{event.startTime} - {event.endTime}</span>
                    </p>
                    <p title="duration">
                      <FontAwesomeIcon icon={['fa', 'clock']}/>
                      <span className="pl-2">{duration(event)}</span>
                    </p>
                    <p title="duration">
                      <FontAwesomeIcon icon={['fa', 'clock']}/>
                      <span className="pl-2">{humanSize(event.diskSpace)}</span>
                    </p>
                  </div>
                  <div className="d-flex justify-content-center my-2">
                    <Link href="/events/[id]/snapshot" as={`/events/${event.id}/snapshot`}>
                      <button type="button"
                              className="btn btn-outline-primary btn-large">
                        <FontAwesomeIcon icon={["fa", "image"]}/>
                        <span className="pl-1">View fullscreen</span>
                      </button>
                    </Link>
                    <Link href="/events/[id]/stream" as={`/events/${event.id}/stream`}>
                      <button type="button"
                              className="btn btn-outline-primary btn-large ml-2">
                        <FontAwesomeIcon icon={["fa", "film"]}/>
                        <span className="pl-1">View video</span>
                      </button>
                    </Link>
                  </div>
                  <div className="card-body">
                    <img src={`data:image/jpeg;base64,${event.objdetect || event.snapshot}`}/>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </form>
    </div>
  )
}
