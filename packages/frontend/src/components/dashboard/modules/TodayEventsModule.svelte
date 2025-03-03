<script lang="ts">
    import { onMount } from 'svelte';
    import { calendarEvents, fetchCalendarEvents } from '../../../stores/appStore';
    import type { CalendarEvent } from '../../../stores/appStore';
    import type { ModuleConfig } from '../../../types/dashboard';
    import CalendarEventModal from '../../CalendarEventModal.svelte';
    import { quintOut } from 'svelte/easing';
    import { crossfade } from 'svelte/transition';
    import { getStudioStatus } from '../../../utils/eventUtils';
    import { createEventDispatcher } from 'svelte';
    
    export let config: ModuleConfig;
    export let isExpanded: boolean;

    const dispatch = createEventDispatcher();

    // Update title immediately when expanded state changes
    function updateTitle(expanded: boolean) {
        dispatch('update', {
            moduleId: config.id,
            title: expanded ? 'Events' : config.title
        });
    }

    // Initial title update
    updateTitle(isExpanded);

    // Watch for changes to expanded state
    $: if (isExpanded !== undefined) {
        updateTitle(isExpanded);
    }

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

    let loading = true;
    let error: string | null = null;
    let todayEvents: CalendarEvent[] = [];
    let selectedEvent: CalendarEvent | null = null;
    let weekOffset = 0;
    let maxWeeks = 12;
    let slideDirection: 'left' | 'right' = 'right';
    let key = 0;

    const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    interface GroupedEvents {
        thisWeek: Map<string, CalendarEvent[]>;
    }

    let groupedEvents: GroupedEvents | null = null;

    function formatTime(dateTimeStr: string): string {
        return new Date(dateTimeStr).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    function isUpcomingToday(dateStr: string): boolean {
        const eventDate = new Date(dateStr);
        const now = new Date();
        const isToday = eventDate.getDate() === now.getDate() &&
                       eventDate.getMonth() === now.getMonth() &&
                       eventDate.getFullYear() === now.getFullYear();
        return isToday && eventDate >= now;
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

    function extractHashtags(text: string | undefined): string[] {
        if (!text) return [];
        const hashtagRegex = /#([\w-]+)/g;
        const matches = text.match(hashtagRegex) || [];
        return matches.map(tag => {
            const tagText = tag.slice(1);
            return tagText.charAt(0).toUpperCase() + tagText.slice(1);
        });
    }

    function isForgeClosedDay(events: CalendarEvent[]): boolean {
            return events.some(event => {
                if (event.summary?.toLowerCase() === "forge closed" && !event.start.dateTime && event.start.date) {
                    const eventDate = new Date(new Date(event.start.date).getTime() + new Date().getTimezoneOffset() * 60000);
                    return true;
                }
                return false;
            });
        }
    
        function isCanceled(event: CalendarEvent): boolean {
            return event.summary?.toLowerCase().includes('canceled');
        }
    
        function getCleanEventName(event: CalendarEvent): string {
            if (!event.summary) return '';
            return event.summary.replace(/\s*\(?canceled\)?/gi, '').trim();
        }

    function getDayInfo(dayName: string) {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
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

        DAYS_OF_WEEK.forEach(day => {
            grouped.thisWeek.set(day, []);
        });

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

            const eventDate = event.start.dateTime
                ? new Date(start)
                : new Date(new Date(start).getTime() + new Date().getTimezoneOffset() * 60000);

            if (eventDate >= startOfTargetWeek && eventDate <= endOfTargetWeek) {
                const dayKey = getDayKey(eventDate);
                let dayEvents = grouped.thisWeek.get(dayKey) || [];
                dayEvents.push(event);
                // Sort events by start time
                dayEvents.sort((a, b) => {
                    const aTime = a.start.dateTime ? new Date(a.start.dateTime).getTime() : 0;
                    const bTime = b.start.dateTime ? new Date(b.start.dateTime).getTime() : 0;
                    return aTime - bTime;
                });
                grouped.thisWeek.set(dayKey, dayEvents);
            }
        });

        return grouped;
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

    $: canGoBack = weekOffset > -2;
    $: canGoForward = weekOffset < maxWeeks - 2;

    // Subscribe to calendar events
    $: if ($calendarEvents) {
        groupedEvents = groupEvents($calendarEvents);
        todayEvents = $calendarEvents
            .filter(event => event.start.dateTime && isUpcomingToday(event.start.dateTime))
            .sort((a, b) =>
                new Date(a.start.dateTime!).getTime() - new Date(b.start.dateTime!).getTime()
            );
    }

    // Refetch events when week changes
    $: {
        weekOffset;
        fetchCalendarEvents();
    }

    let dayCheckInterval: number;

    function checkForDayChange() {
        const now = new Date();
        const nextMidnight = new Date(now);
        nextMidnight.setHours(24, 0, 0, 0);
        const timeUntilMidnight = nextMidnight.getTime() - now.getTime();

        // Clear any existing interval
        if (dayCheckInterval) clearTimeout(dayCheckInterval);

        // Set timeout for next midnight
        dayCheckInterval = setTimeout(async () => {
            console.log('Day changed, refreshing events...');
            await fetchCalendarEvents(true);
            // Set up next day's check
            checkForDayChange();
        }, timeUntilMidnight);
    }

    onMount(() => {
        (async () => {
            try {
                await fetchCalendarEvents();
                // Start checking for day changes
                checkForDayChange();
            } catch (e) {
                error = e instanceof Error ? e.message : 'Failed to load events';
            } finally {
                loading = false;
            }
        })();

        // Cleanup interval on component destroy
        return () => {
            if (dayCheckInterval) clearTimeout(dayCheckInterval);
        };
    });
</script>

<div class="events-module">
    {#if loading}
        <div class="loading">Loading events...</div>
    {:else if error}
        <div class="error">Failed to load events: {error}</div>
    {:else}
        {#key isExpanded}
            {#if !isExpanded}
                <div class="events-summary" in:receive={{key}} out:send={{key}}>
                    <div class="upcoming-events">
                        {#if todayEvents.length > 0}
                            {#each todayEvents as event, i}
                                <div class="event-preview" on:click={() => selectedEvent = event}>
                                    <div class="event-time-block">
                                        <p class="event-time">
                                            {formatTime(event.start.dateTime!)}
                                        </p>
                                        <p class="event-duration">
                                            {getEventDuration(event)}
                                            {#if isCanceled(event)}
                                                <span class="canceled-indicator">CANCELED</span>
                                            {/if}
                                        </p>
                                    </div>
                                    <div class="event-details">
                                        <p class="event-title" class:canceled={isCanceled(event)}>
                                            {getCleanEventName(event)}
                                        </p>
                                        {#if event.description}
                                            {@const studioStatus = getStudioStatus(event)}
                                            {#if studioStatus}
                                                <div class="studio-notice" data-content={studioStatus.status}>
                                                    {studioStatus.message}
                                                </div>
                                            {/if}
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                        {:else}
                            <p class="no-events">No upcoming events</p>
                        {/if}
                    </div>
                </div>
            {:else if groupedEvents}
                <div class="calendar-view" in:receive={{key}} out:send={{key}}>
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
                    <div class="week-container">
                        <div class="week-grid">
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
                                                    {formatTime(event.start.dateTime || '')}
                                                    <span class="event-duration">
                                                        ({getEventDuration(event)})
                                                        {#if isCanceled(event)}
                                                            <span class="canceled-indicator">CANCELED</span>
                                                        {/if}
                                                    </span>
                                                </div>
                                                <div class="event-card-content">
                                                    <div class="event-card-title" class:canceled={isCanceled(event)}>
                                                        {getCleanEventName(event)}
                                                    </div>
                                                    {#if event.description}
                                                        {@const studioStatus = getStudioStatus(event)}
                                                        {#if studioStatus}
                                                            <div class="studio-notice" data-content={studioStatus.status}>
                                                                {studioStatus.message}
                                                            </div>
                                                        {/if}
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
                <div class="no-events-container" in:receive={{key}} out:send={{key}}>
                    <p class="no-events">No upcoming events found</p>
                </div>
            {/if}
        {/key}
    {/if}
</div>

{#if selectedEvent}
    <CalendarEventModal
        event={selectedEvent}
        onClose={() => selectedEvent = null}
    />
{/if}

<style>
    .events-module {
        height: 100%;
        overflow: hidden;
        position: relative;
    }

    .loading, .error {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #666;
        font-style: italic;
    }

    .error {
        color: #dc3545;
        padding: 1rem;
        text-align: center;
    }

    .events-summary {
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .upcoming-events {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .event-preview {
        background: #ffffff;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border: 1px solid #e0e0e0;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        position: relative;
        cursor: pointer;
    }

    .event-preview:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .event-time-block {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .event-time {
        color: #333;
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
        line-height: 1.2;
    }

    .event-duration {
        color: #666;
        font-size: 0.875rem;
        margin: 0;
    }

    .event-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .event-title {
        font-weight: 600;
        font-size: 1.125rem;
        color: #333;
        margin: 0;
        line-height: 1.4;
    }

    .event-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
    }

    .event-tag {
        background: #e5e7eb;
        color: #4b5563;
        font-size: 0.7rem;
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        font-weight: 500;
    }

    /* Calendar View Styles */
    .calendar-view {
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .calendar-navigation {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 1rem;
        padding: 0.5rem;
    }

    .nav-button {
        background: #2196F3;
        color: white;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
    }

    .nav-button:hover:not(.disabled) {
        background: #1976D2;
        transform: scale(1.1);
    }

    .nav-button.disabled {
        background: #ccc;
        cursor: not-allowed;
        opacity: 0.7;
    }

    .week-range {
        font-size: 1.1rem;
        font-weight: 600;
        color: #333;
        min-width: 120px;
        text-align: center;
    }

    .week-container {
        flex: 1;
        overflow: hidden;
        position: relative;
    }

    .week-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0.5rem;
        padding: 0.5rem;
        height: 100%;
        overflow-y: auto;
    }

    .day-column {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-height: 150px;
        background: #fff;
        border-radius: 8px;
        transition: background-color 0.2s;
    }

    .day-header {
        padding: 0.75rem 0.5rem;
        background: #f3f4f6;
        border-radius: 8px 8px 0 0;
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
        padding: 0.5rem;
        overflow-y: auto;
        flex: 1;
    }

    .event-card {
        background: white;
        border-radius: 6px;
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        transition: transform 0.2s, box-shadow 0.2s;
        cursor: pointer;
    }

    .event-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .event-card-time {
        color: #2196F3;
        font-weight: 600;
        font-size: 0.85rem;
        margin-bottom: 0.25rem;
    }

    .event-duration {
        color: #666;
        font-weight: normal;
        font-size: 0.8rem;
        margin-left: 0.5rem;
    }

    .event-card-title {
        font-weight: 600;
        color: #333;
        font-size: 0.9rem;
        line-height: 1.4;
        margin-bottom: 0.25rem;
    }

    .event-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
    }

    .event-tag {
        background: #e5e7eb;
        color: #4b5563;
        font-size: 0.7rem;
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        font-weight: 500;
    }

    .studio-notice {
        margin-top: 0.75rem;
        padding: 0.75rem;
        border-radius: 6px;
        font-size: 0.875rem;
        line-height: 1.4;
        font-weight: 500;
    }

    .studio-notice[data-content="studio is unavailable"] {
        background: #fee2e2;
        color: #dc2626;
        border: 1px solid #fecaca;
    }

    .studio-notice[data-content="studio is partially available"] {
        background: #fef3c7;
        color: #d97706;
        border: 1px solid #fde68a;
    }

    .studio-notice[data-content="studio is available"] {
        background: #dcfce7;
        color: #16a34a;
        border: 1px solid #bbf7d0;
    }

    .past-day {
        background-color: #f3f4f6;
    }

    .past-day .day-header {
        background-color: #e5e7eb;
    }

    .current-day {
        background-color: #eef2ff;
        box-shadow: 0 0 0 2px #2196F3;
    }

    .current-day .day-header {
        background-color: #e0e7ff;
        color: #1976D2;
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

    .canceled-indicator {
        font-size: 0.7rem;
        font-weight: 600;
        color: #dc2626;
        background: #fee2e2;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        display: inline-block;
        margin-left: 0.5rem;
        vertical-align: middle;
        display: inline-block;
        margin-left: 0.5rem;
    }

    .canceled {
        text-decoration: line-through;
        color: #666;
    }

    .no-events {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 2rem;
        background: #ffffff;
        border-radius: 8px;
        margin: 0.75rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border: 1px solid #e0e0e0;
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