<script lang="ts">
    import { onMount } from 'svelte';
    import { calendarEvents, fetchCalendarEvents, type CalendarEvent } from '../stores/appStore';
    import CalendarEventModal from './CalendarEventModal.svelte';
    import { quintOut } from 'svelte/easing';
    import { crossfade } from 'svelte/transition';

    const [send, receive] = crossfade({
        duration: 400,
        easing: quintOut,
        fallback(node, params) {
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            
            const dx = slideDirection === 'left' ? 300 : -300;
            
            return {
                duration: 400,
                easing: quintOut,
                css: (t, u) => `
                    transform: ${transform} translate(${u * dx}px);
                    opacity: ${t}
                `
            };
        }
    });

    let selectedEvent: CalendarEvent | null = null;
    let weekOffset = 0;
    let maxWeeks = 12; // Show up to 12 weeks in the future
    let slideDirection: 'left' | 'right' = 'right';
    let key = 0; // Key to force re-render of week grid
    
    interface GroupedEvents {
        thisWeek: Map<string, CalendarEvent[]>;
    }
    
    let calendar: HTMLElement;
    let error: string | null = null;
    let loading = true;
    let groupedEvents: GroupedEvents | null = null;

    // Subscribe to calendar events store
    $: if ($calendarEvents) {
        groupedEvents = groupEvents($calendarEvents);
    }

    // Refetch events when week changes
    $: {
        weekOffset;
        fetchCalendarEvents();
    }

    function navigateWeek(direction: 'prev' | 'next') {
        if (direction === 'prev' && weekOffset > -2) {
            slideDirection = 'right';
            weekOffset--;
            key++;
        } else if (direction === 'next' && weekOffset < maxWeeks - 2) {
            slideDirection = 'left';
            weekOffset++;
            key++;
        }
    }

    const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    function extractHashtags(text: string | undefined): string[] {
        if (!text) return [];
        const hashtagRegex = /#([\w-]+)/g;
        const matches = text.match(hashtagRegex) || [];
        return matches.map(tag => {
            // Remove # and capitalize first letter
            const tagText = tag.slice(1); // Remove #
            return tagText.charAt(0).toUpperCase() + tagText.slice(1);
        });
    }

    function isForgeClosedDay(events: CalendarEvent[]): boolean {
        return events.some(event => {
            if (event.summary?.toLowerCase() === "forge closed" && !event.start.dateTime && event.start.date) {
                // For all-day events, create a date that accounts for timezone offset
                const eventDate = new Date(new Date(event.start.date).getTime() + new Date().getTimezoneOffset() * 60000);
                return true;
            }
            return false;
        });
    }

    function getDayInfo(dayName: string) {
        const today = new Date();
        today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
        
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Go to start of current week
        
        // Add week offset
        startOfWeek.setDate(startOfWeek.getDate() + (weekOffset * 7));
        
        const dayIndex = DAYS_OF_WEEK.indexOf(dayName);
        const targetDate = new Date(startOfWeek);
        targetDate.setDate(startOfWeek.getDate() + dayIndex);
        
        return {
            name: dayName,
            date: targetDate.getDate(),
            month: targetDate.toLocaleString('default', { month: 'short' }),
            fullDate: targetDate
        };
    }

    $: canGoBack = weekOffset > -2;
    $: canGoForward = weekOffset < maxWeeks - 2;

    function isPastDay(date: Date): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return date < today;
    }

    function isToday(date: Date): boolean {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }

    function getDayKey(date: Date): string {
        return DAYS_OF_WEEK[date.getDay()];
    }

    function groupEvents(events: CalendarEvent[]): GroupedEvents {
        const grouped: GroupedEvents = {
            thisWeek: new Map()
        };

        // Initialize all days
        DAYS_OF_WEEK.forEach(day => {
            grouped.thisWeek.set(day, []);
        });

        // Get the start and end of the target week
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        
        const startOfTargetWeek = new Date(today);
        startOfTargetWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
        startOfTargetWeek.setHours(0, 0, 0, 0);
        
        const endOfTargetWeek = new Date(startOfTargetWeek);
        endOfTargetWeek.setDate(startOfTargetWeek.getDate() + 6);
        endOfTargetWeek.setHours(23, 59, 59, 999);

        events.forEach(event => {
            const start = event.start.dateTime || event.start.date;
            if (!start) return;

            // For all-day events, create a date that accounts for timezone offset
            const eventDate = event.start.dateTime
                ? new Date(start)
                : new Date(new Date(start).getTime() + new Date().getTimezoneOffset() * 60000);

            if (eventDate >= startOfTargetWeek && eventDate <= endOfTargetWeek) {
                const dayKey = getDayKey(eventDate);
                const dayEvents = grouped.thisWeek.get(dayKey) || [];
                dayEvents.push(event);
                grouped.thisWeek.set(dayKey, dayEvents);
            }
        });

        return grouped;
    }

    function formatEventTime(dateStr: string | undefined): string {
        if (!dateStr) return 'All Day';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });
    }

    function getEventDuration(event: CalendarEvent): string {
        if (!event.start.dateTime || !event.end.dateTime) return 'All Day';
        
        const start = new Date(event.start.dateTime);
        const end = new Date(event.end.dateTime);
        const durationMs = end.getTime() - start.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours === 0) {
            return `${minutes}min`;
        } else if (minutes === 0) {
            return `${hours}hr`;
        } else {
            return `${hours}hr ${minutes}min`;
        }
    }

    onMount(async () => {
        try {
            await fetchCalendarEvents();
            const events = $calendarEvents;
            groupedEvents = groupEvents(events);
        } catch (err) {
            console.error('Error loading calendar events:', err);
            error = err instanceof Error ? err.message : 'Failed to load calendar events';
        } finally {
            loading = false;
        }
    });
</script>

<div class="calendar-view" bind:this={calendar}>
    <h2>Calendar</h2>
    <div class="events-container">
        {#if loading}
            <p class="loading">Loading events...</p>
        {:else if error}
            <p class="error">{error}</p>
        {:else if groupedEvents}
            <div class="calendar-navigation">
                <button 
                    class="nav-button" 
                    class:disabled={!canGoBack}
                    on:click={() => navigateWeek('prev')}
                    disabled={!canGoBack}
                >
                    ←
                </button>
                <div class="week-range">
                    {#if weekOffset === 0}
                        This Week
                    {:else if weekOffset === 1}
                        Next Week
                    {:else if weekOffset < 0}
                        {Math.abs(weekOffset)} Week{Math.abs(weekOffset) > 1 ? 's' : ''} Ago
                    {:else}
                        {weekOffset} Weeks Ahead
                    {/if}
                </div>
                <button 
                    class="nav-button" 
                    class:disabled={!canGoForward}
                    on:click={() => navigateWeek('next')}
                    disabled={!canGoForward}
                >
                    →
                </button>
            </div>
            <div class="event-group">
                <div class="week-container">
                    <div
                        class="week-grid"
                        in:receive={{key}}
                        out:send={{key}}
                    >
                        {#each DAYS_OF_WEEK as day}
                            {@const dayInfo = getDayInfo(day)}
                            {@const dayEvents = groupedEvents.thisWeek.get(day) || []}
                            {@const isClosed = isForgeClosedDay(dayEvents)}
                            {@const isPast = isPastDay(dayInfo.fullDate)}
                            {@const isCurrentDay = isToday(dayInfo.fullDate)}
                            <div class="day-column {isClosed ? 'forge-closed' : ''} {isPast ? 'past-day' : ''} {isCurrentDay ? 'current-day' : ''}">
                                <div class="day-header">
                                    <div class="day-name">{dayInfo.name}</div>
                                    <div class="day-date">{dayInfo.month} {dayInfo.date}</div>
                                    {#if isClosed}
                                        <div class="closed-indicator">CLOSED</div>
                                    {/if}
                                </div>
                                <div class="day-events">
                                    {#each dayEvents.filter(event => event.summary?.toLowerCase() !== "forge closed") as event}
                                        <div class="event-card" on:click={() => selectedEvent = event}>
                                            <div class="event-card-time">
                                                {formatEventTime(event.start.dateTime)}
                                                <span class="event-duration">({getEventDuration(event)})</span>
                                            </div>
                                            <div class="event-card-content">
                                                <div class="event-card-title">{event.summary}</div>
                                                {#if event.description}
                                                    <div class="event-tags">
                                                        {#each extractHashtags(event.description) as tag}
                                                            <span class="event-tag">{tag}</span>
                                                        {/each}
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {:else}
            <p class="no-events">No upcoming events found</p>
        {/if}
    </div>
</div>

{#if selectedEvent}
    <CalendarEventModal
        event={selectedEvent}
        onClose={() => selectedEvent = null}
    />
{/if}

<style>
    .calendar-view {
        width: 100%;
        height: 100%;
        padding: 2rem;
    }

    h2 {
        color: #333;
        margin: 0 0 2rem 0;
        font-size: 1.8rem;
    }

    .events-container {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .calendar-navigation {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .nav-button {
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
    }

    .nav-button:hover:not(.disabled) {
        background: #388E3C;
        transform: scale(1.1);
    }

    .nav-button.disabled {
        background: #ccc;
        cursor: not-allowed;
        opacity: 0.7;
    }

    .week-range {
        font-size: 1.2rem;
        font-weight: 600;
        color: #333;
        min-width: 150px;
        text-align: center;
    }

    .event-group {
        background: transparent;
    }

    .week-container {
        position: relative;
        overflow: hidden;
    }

    .week-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0.5rem;
        padding: 0.5rem;
        background: white;
        margin: 0;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        position: relative;
    }

    .day-column {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-height: 200px;
        transition: background-color 0.2s;
        border-radius: 8px;
    }

    .day-events {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .event-card {
        background: white;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        cursor: pointer;
    }

    .past-day {
        background-color: #f3f4f6;
    }

    .past-day .day-header {
        background-color: #e5e7eb;
    }

    .past-day .event-card {
        opacity: 0.7;
        background-color: #f3f4f6;
    }

    .past-day .event-card:hover {
        transform: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .past-day .event-card-time {
        color: #6b7280;
    }

    .current-day {
        background-color: #eef2ff;
        box-shadow: 0 0 0 2px #6366f1;
    }

    .current-day .day-header {
        background-color: #e0e7ff;
        color: #4338ca;
    }

    .forge-closed {
        background-color: #fee2e2;
    }

    .forge-closed .day-header {
        background-color: #fecaca;
    }

    .closed-indicator {
        font-size: 0.7rem;
        font-weight: 600;
        color: #dc2626;
        background: #fff;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        margin-top: 0.25rem;
    }

    .day-header {
        padding: 0.75rem 0.5rem;
        background: #f3f4f6;
        border-radius: 8px;
        text-align: center;
        color: #4b5563;
    }

    .day-name {
        font-weight: 600;
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
    }

    .day-date {
        font-size: 0.8rem;
        color: #6b7280;
    }

    .day-events {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .event-card {
        background: white;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        cursor: pointer;
    }

    .event-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        background: #f8f8f8;
    }

    .event-card-time {
        color: #2563eb;
        font-weight: 600;
        font-size: 0.9rem;
        padding-bottom: 0.25rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .event-duration {
        color: #6b7280;
        font-weight: normal;
        margin-left: 0.5rem;
    }

    .event-card-content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .event-card-title {
        font-weight: 600;
        color: #333;
        font-size: 0.9rem;
        line-height: 1.4;
    }

    .event-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .event-tag {
        background: #e5e7eb;
        color: #4b5563;
        font-size: 0.8rem;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-weight: 500;
    }

    .error {
        color: #dc3545;
        padding: 1.5rem;
        background: white;
        border-radius: 12px;
        border: 1px solid #dc3545;
        text-align: center;
        margin: 0;
    }

    .loading, .no-events {
        text-align: center;
        color: #666;
        padding: 2rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        margin: 0;
    }

    @media (max-width: 1024px) {
        .week-grid {
            grid-template-columns: repeat(4, 1fr);
        }
    }

    @media (max-width: 768px) {
        .week-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 480px) {
        .week-grid {
            grid-template-columns: 1fr;
        }
    }
</style>