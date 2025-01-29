<script lang="ts">
  // Mock data for upcoming events
  const events = [
    { title: 'Workshop: Intro to 3D Printing', date: '2023-07-15', time: '14:00 - 16:00' },
    { title: 'Skillshare: Advanced Welding Techniques', date: '2023-07-18', time: '18:30 - 20:30' },
    { title: 'Community Meetup', date: '2023-07-20', time: '19:00 - 21:00' },
    { title: 'Guest Lecture: Future of Sustainable Manufacturing', date: '2023-07-25', time: '17:00 - 18:30' },
    { title: 'Happy Hour: Networking for Makers', date: '2023-07-28', time: '18:00 - 20:00' },
  ];
</script>

<div class="calendar">
  <h3>Upcoming Events</h3>
  {#if events.length === 0}
    <p>No upcoming events.</p>
  {:else}
    <ul>
      {#each events as event}
        <li>
          <strong>{event.title}</strong>
          <p>{new Date(event.date).toLocaleDateString()} - {event.time}</p>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .calendar {
    background-color: #f9f9f9;
    border-radius: 5px;
    padding: 15px;
    height: 100%;
    overflow-y: auto;
  }

  h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #333;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    background-color: white;
    border-radius: 5px;
    padding: 10px;
    margin-bottom: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  li strong {
    display: block;
    margin-bottom: 5px;
    color: #007bff;
  }

  p {
    margin: 5px 0 0;
    font-size: 0.9em;
    color: #666;
  }
</style>
