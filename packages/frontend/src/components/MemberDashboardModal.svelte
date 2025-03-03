<script lang="ts">
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';
    import { socket } from '../stores/socket';
    import { members, kudos, kudosActions, activities, syncStores, messageActions, systemAlertActions } from '../stores/appStore';
    import type { Member, Kudos, Message, Activity } from '../stores/appStore';
    import { offlineStorage, pendingActions } from '../lib/offline';
    import { signIn, signOut } from '../services/memberAuthService';
    import { marked } from 'marked';

    // Configure marked for safe HTML
    const markedOptions = {
        breaks: true, // Convert line breaks to <br>
        gfm: true    // Enable GitHub Flavored Markdown
    };

    function parseMarkdown(content: string): string {
        try {
            return marked.parse(content, markedOptions) as string;
        } catch (error) {
            console.error('Error parsing markdown:', error);
            return content;
        }
    }

    export let member: Member;
    export let onClose: () => void;

    // Current view state
    let currentView = member.isActive ? 'signOut' : 'signIn';
    let kudosMessage = '';
    let selectedRecipients: Member[] = [];
    let isOnline = false;
    let searchTerm = '';

    // Subscribe to socket connection status
    socket.subscribe(socketInstance => {
        isOnline = socketInstance?.connected ?? false;
    });

    // Filter out the current member from the recipient list and apply search filter
    $: availableRecipients = $members
        .filter(m => m.id !== member.id)
        .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

    function formatDate(date: Date | undefined): string {
        if (!date) return '';
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }

    async function handleKudosSubmit() {
        if (!kudosMessage.trim() || selectedRecipients.length === 0) return;

        try {
            const kudosData = {
                from: [{ id: member.id, name: member.name }],
                to: selectedRecipients.map(r => ({ id: r.id, name: r.name })),
                message: kudosMessage.trim()
            };

            if (isOnline) {
                $socket?.emit('kudos:create', kudosData);
            } else {
                await pendingActions.add({
                    type: 'kudos',
                    data: kudosData
                });
            }

            kudosActions.add(kudosData);
            
            await offlineStorage.store('kudos', {
                ...kudosData,
                id: crypto.randomUUID(),
                date: new Date().toISOString()
            });

            systemAlertActions.add('success', 'Kudos sent successfully!');
            kudosMessage = '';
            selectedRecipients = [];
            
        } catch (error) {
            console.error('Kudos error:', error);
            systemAlertActions.add('error', 'Failed to send kudos. Please try again.');
        }
    }

    let activityPercentages = new Map<string, number>();

    // Initialize activity percentages when activities change
    $: if ($activities) {
        $activities.forEach((activity) => {
            if (!activityPercentages.has(activity.id)) {
                activityPercentages.set(activity.id, 0);
            }
        });
    }

    // Sync activities when online
    $: if ($socket?.connected) {
        syncStores();
    }

    async function handleSignInOut() {
        try {
            if (member.isActive) {
                // For sign out, we need to submit activities
                const totalPercentage = Array.from(activityPercentages.values()).reduce((sum, val) => sum + val, 0);
                if (totalPercentage === 0) {
                    systemAlertActions.add('error', 'Please allocate your time across activities before signing out.');
                    return;
                }
                if (totalPercentage > 100) {
                    systemAlertActions.add('error', 'Total time allocation cannot exceed 100%.');
                    return;
                }

                const activitiesData = Array.from(activityPercentages.entries())
                    .filter(([_, percentage]) => percentage > 0)
                    .map(([id, percentage]) => ({
                        id,
                        time: percentage / 100 // Convert percentage to decimal
                    }));

                // Validate data first
                const memberId = member.id;
                const signInRecordId = member.signInRecordId;
                
                if (!signInRecordId || !memberId) {
                    systemAlertActions.add('error', 'Missing required data for sign-out. Please try again.');
                    return;
                }

                // Close modal immediately for better UX
                onClose();
                
                // Then perform sign-out in the background
                signOut(memberId, signInRecordId, activitiesData).catch(error => {
                    console.error('Sign out error:', error);
                    systemAlertActions.add('error', 'Failed to sign out. Please try again.');
                });
            } else {
                if (!member.currentMemberType?.id) {
                    systemAlertActions.add('error', 'No member type selected. Please try again.');
                    return;
                }

                // Capture values before closing modal
                const memberId = member.id;
                const memberTypeId = member.currentMemberType.id;

                // Close modal immediately for better UX
                onClose();
                
                // Then perform sign-in in the background
                signIn(memberId, memberTypeId).catch(error => {
                    console.error('Sign in error:', error);
                    systemAlertActions.add('error', 'Failed to sign in. Please try again.');
                });
            }
        } catch (error) {
            console.error('Sign in/out error:', error);
            systemAlertActions.add('error', 'Failed to update sign in status. Please try again.');
        }
    }

    function adjustOtherSliders(changedId: string, newValue: number, newActivityPercentages: Map<string, number>) {
        const otherIds = Array.from(newActivityPercentages.keys()).filter(id => id !== changedId);
        let remainingPercentage = 100 - newValue;
        let adjustedActivityPercentages = new Map(newActivityPercentages);

        if (otherIds.length === 0) return;

        let totalOtherValues = otherIds.reduce((sum, id) => {
            const value = adjustedActivityPercentages.get(id) || 0;
            return value > 0 ? sum + value : sum;
        }, 0);


        if (totalOtherValues <= 0) {
             otherIds.forEach(id => {
                const activityValue = adjustedActivityPercentages.get(id);
                if (activityValue != null && activityValue > 0) {
                    adjustedActivityPercentages.set(id, Math.round(remainingPercentage / otherIds.filter(id => adjustedActivityPercentages.get(id) != null && (adjustedActivityPercentages.get(id) ?? 0) > 0).length));
                }
            });
            return;
        }

     otherIds.forEach(id => {
          const currentValue = adjustedActivityPercentages.get(id);
          if (typeof currentValue === 'number' && currentValue > 0) {
              let newPercentage = Math.round(((currentValue ?? 0) / totalOtherValues) * remainingPercentage);
              adjustedActivityPercentages.set(id, newPercentage);
          }
      });
        
        newActivityPercentages.clear();
        adjustedActivityPercentages.forEach((value, key) => newActivityPercentages.set(key, value));
    }

    function handleSliderChange(activityId: string, value: string) {
        const newValue = parseInt(value, 10);
        let newActivityPercentages = new Map(activityPercentages);

        if (newValue < 0) {
            newActivityPercentages.set(activityId, 0);
        } else if (newValue > 100) {
            newActivityPercentages.set(activityId, 100);
        } else {
            newActivityPercentages.set(activityId, newValue);
        }
        
        adjustOtherSliders(activityId, newValue, newActivityPercentages);
        activityPercentages = newActivityPercentages;
    }

    // Calculate top 5 activities
    $: topFiveActivities = member.topActivities && member.topActivities.length > 0 ?
        Array.from(
            member.topActivities.reduce((acc: Map<string, number>, activities: string) => {
                if (activities) {
                    activities.split(',').forEach(activity => {
                        const trimmed = activity.trim();
                        if (trimmed) {
                            acc.set(trimmed, (acc.get(trimmed) || 0) + 1);
                        }
                    });
                }
                return acc;
            }, new Map<string, number>())
        )
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 5)
        .map(([activity]) => activity)
        : [];

    $: totalPercentage = Array.from(activityPercentages.values()).reduce((sum, val) => sum + val, 0);

    $: isSignOutValid = totalPercentage === 100;

    let currentMember: Member;

    $: currentMember = $members.find(m => m.id === member.id) || member;
    $: memberMessages = currentMember.messages || [];

    async function markMessageAsRead(messageId: string) {
        try {
            const response = await fetch(`/api/messages/${messageId}/read`, {
                method: 'PUT'
            });
            const data = await response.json();
            if (data.success) {
                // Update store state
                messageActions.markAsRead(messageId);
                // Force reactivity update by triggering a store update
                members.update(currentMembers => [...currentMembers]);
            } else {
                throw new Error('Failed to mark message as read');
            }
        } catch (error) {
            console.error('Mark as read error:', error);
            systemAlertActions.add('error', 'Failed to mark message as read. Please try again.');
        }
    }
</script>

<div class="modal-backdrop" on:click|self={onClose} transition:fade>
    <div class="modal-content">
        <div class="modal-sidebar">
            {#if currentMember.headshot}
                <img
                    src={currentMember.headshot}
                    alt={currentMember.name}
                    class="member-avatar"
                />
            {/if}
            <h2>{currentMember.name}</h2>
            <div class="member-status">
                {#if currentMember.isActive}
                    <span class="status active">Signed In</span>
                    {#if currentMember.currentArea}
                        <p class="current-area">Currently in: {currentMember.currentArea}</p>
                    {/if}
                    {#if currentMember.signInTime}
                        <p class="sign-in-time">Since {formatDate(currentMember.signInTime)}</p>
                    {/if}
                {:else}
                    <span class="status">Signed Out</span>
                {/if}
            </div>

            <nav class="dashboard-nav">
                <button
                    class="nav-item"
                    class:active={currentView === (currentMember.isActive ? 'signOut' : 'signIn')}
                    on:click={() => currentView = currentMember.isActive ? 'signOut' : 'signIn'}
                >
                    {currentMember.isActive ? 'Sign Out' : 'Sign In'}
                </button>
                <button 
                    class="nav-item" 
                    class:active={currentView === 'messages'}
                    on:click={() => currentView = 'messages'}
                >
                    Your Messages
                    {#if memberMessages.filter(m => !m.read).length > 0}
                        <span class="notification-badge">{memberMessages.filter(m => !m.read).length}</span>
                    {/if}
                </button>
                <button 
                    class="nav-item" 
                    class:active={currentView === 'stats'}
                    on:click={() => currentView = 'stats'}
                >
                    Your Stats
                </button>
                <button 
                    class="nav-item" 
                    class:active={currentView === 'kudos'}
                    on:click={() => currentView = 'kudos'}
                >
                    Send Kudos
                </button>
                <button 
                    class="nav-item" 
                    class:active={currentView === 'help'}
                    on:click={() => currentView = 'help'}
                >
                    Help
                </button>
                <button 
                    class="nav-item"
                    on:click={onClose}
                >
                    Back to Home
                </button>
            </nav>
        </div>

        <div class="modal-main">
            <div class="content-area">
                {#if currentView === 'signIn' || currentView === 'signOut'}
                    <div class="sign-section">
                        <h3>{member.isActive ? 'Sign Out' : 'Sign In'}</h3>
                        
                        {#if member.isActive}
                            <div class="activities-form">
                                <div class="activities-header">
                                    <p class="instructions">Please allocate your time across activities (total must be 100%):</p>
                                </div>
                                
                                <div class="activities-list scrollable">
                                       {#each $activities.sort((a, b) => {
                                           const aIndex = topFiveActivities.indexOf(a.activity);
                                           const bIndex = topFiveActivities.indexOf(b.activity);
                                           
                                           if (aIndex === -1 && bIndex === -1) return 0;
                                           if (aIndex === -1) return 1;
                                           if (bIndex === -1) return -1;
                                           return aIndex - bIndex;
                                       }) as activity (activity.id)}
                                           <div class="activity-item">
                                               <label for={activity.id}>{activity.activity}</label>
                                               <div class="slider-group">
                                                   <input
                                                       type="range"
                                                       id={activity.id}
                                                       min="0"
                                                       max="100"
                                                       value={activityPercentages.get(activity.id) ?? 0}
                                                       on:input={(e: Event & { currentTarget: HTMLInputElement }) => handleSliderChange(activity.id, e.currentTarget.value)}
                                                   />
                                                   <span class="percentage-value">
                                                       {activityPercentages.get(activity.id) ?? 0}%
                                                   </span>
                                               </div>
                                           </div>
                                       {/each}
                               </div>
                               <div class="activities-footer">
                                   <div class="footer-content">
                                       <button
                                           class="action-button"
                                           class:disabled={!isSignOutValid}
                                           disabled={!isSignOutValid}
                                           on:click={handleSignInOut}
                                       >
                                           Sign Out Now
                                       </button>
                                       {#if totalPercentage > 100}
                                           <span class="error-message">Total percentage cannot exceed 100%</span>
                                       {:else if totalPercentage < 100}
                                           <span class="error-message">Please allocate 100% of your time</span>
                                       {/if}
                                   </div>
                               </div>
                           </div>
                        {:else}
                            <div class="sign-in-section">
                                <div class="member-types">
                                    <p class="instructions">Select your member type:</p>
                                    <div class="member-type-buttons">
                                        {#each member.memberTypes as type}
                                            <button
                                                class="member-type-button"
                                                class:selected={member.currentMemberType?.id === type.id}
                                                on:click={() => member.currentMemberType = type}
                                            >
                                                {type.group}
                                            </button>
                                        {/each}
                                    </div>
                                </div>
                                <button
                                    class="action-button"
                                    disabled={!member.currentMemberType}
                                    on:click={handleSignInOut}
                                >
                                    Sign In Now
                                </button>
                                {#if !member.currentMemberType}
                                    <p class="error-message">Please select a member type</p>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {:else if currentView === 'messages'}
                    <div class="messages-section">
                        <h3>Your Messages</h3>
                        {#if memberMessages.length === 0}
                            <p class="no-data">No messages</p>
                        {:else}
                            <div class="messages-container">
                                {#if memberMessages.some(m => !m.read)}
                                    <div class="message-group">
                                        <h4>Unread Messages</h4>
                                        {#each memberMessages.filter(m => !m.read) as message}
                                            <div class="message-card unread" class:important={message.important}>
                                                <div class="message-header">
                                                    <p class="message-time">{formatDate(new Date(message.messageDate))}</p>
                                                </div>
                                                <p class="message-content">{@html parseMarkdown(message.content)}</p>
                                                <button
                                                    class="mark-read-button"
                                                    on:click={() => markMessageAsRead(message.id)}
                                                >
                                                    Mark as Read
                                                </button>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                                
                                {#if memberMessages.some(m => m.read)}
                                    <div class="message-group">
                                        <h4>Read Messages</h4>
                                        {#each memberMessages.filter(m => m.read) as message}
                                            <div class="message-card" class:important={message.important}>
                                                <div class="message-header">
                                                    <p class="message-time">{formatDate(new Date(message.messageDate))}</p>
                                                </div>
                                                <p class="message-content">{@html parseMarkdown(message.content)}</p>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {:else if currentView === 'stats'}
                    <div class="stats-section">
                        <h3>Your Stats</h3>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <span class="stat-value">{Number(member.totalHours || 0).toFixed(2)}</span>
                                <span class="stat-label">Total Hours</span>
                            </div>
                            <div class="stat-card">
                                <span class="stat-value">{Number(member.totalPoints || 0).toFixed(2)}</span>
                                <span class="stat-label">Total Points</span>
                            </div>
                            <div class="stat-card">
                                <span class="stat-value">{Number(member.weeklyStreak || 0).toFixed(2)}</span>
                                <span class="stat-label">Weekly Streak</span>
                            </div>
                        </div>

                        
                            <div class="activities-section">
                               <h4>Top 5 Activities</h4>
                               <ul class="activities-list">
                                   {#each topFiveActivities as activity}
                                       <li>{activity}</li>
                                   {/each}
                               </ul>
                            </div>
                        

                        <div class="kudos-stats">
                            <h4>Kudos History</h4>
                            <div class="kudos-summary">
                                <div class="kudos-stat">
                                    <span class="stat-value">{member.kudosReceived?.length || 0}</span>
                                    <span class="stat-label">Received</span>
                                </div>
                                <div class="kudos-stat">
                                    <span class="stat-value">{member.kudosGiven?.length || 0}</span>
                                    <span class="stat-label">Given</span>
                                </div>
                            </div>
                        </div>
                    </div>
                {:else if currentView === 'kudos'}
                    <div class="kudos-section">
                        <h3>Send Kudos</h3>
                        <div class="kudos-form">
                            <textarea
                                bind:value={kudosMessage}
                                placeholder="Write your kudos message..."
                                rows="3"
                            ></textarea>

                            <div class="recipients-selection">
                                <h4>Select Recipients</h4>
                                <div class="search-bar">
                                    <input
                                        type="text"
                                        bind:value={searchTerm}
                                        placeholder="Search members..."
                                        class="search-input"
                                    />
                                </div>
                                {#if selectedRecipients.length > 0}
                                    <div class="selected-recipients">
                                        <p class="selected-label">Selected ({selectedRecipients.length}):</p>
                                        <div class="selected-tags">
                                            {#each selectedRecipients as recipient}
                                                <button
                                                    class="selected-tag"
                                                    on:click={() => {
                                                        selectedRecipients = selectedRecipients.filter(r => r.id !== recipient.id);
                                                    }}
                                                >
                                                    {recipient.name}
                                                    <span class="remove-tag">×</span>
                                                </button>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                                <div class="recipients-grid">
                                    {#each availableRecipients as recipient}
                                        <button
                                            class="recipient-card"
                                            class:selected={selectedRecipients.includes(recipient)}
                                            on:click={() => {
                                                if (selectedRecipients.includes(recipient)) {
                                                    selectedRecipients = selectedRecipients.filter(r => r.id !== recipient.id);
                                                } else {
                                                    selectedRecipients = [...selectedRecipients, recipient];
                                                }
                                            }}
                                        >
                                            {recipient.name}
                                        </button>
                                    {/each}
                                </div>
                            </div>

                            <button
                                class="send-kudos-button"
                                disabled={!kudosMessage.trim() || selectedRecipients.length === 0}
                                on:click={handleKudosSubmit}
                            >
                                Send Kudos
                            </button>
                        </div>
                    </div>
                {:else if currentView === 'help'}
                    <div class="help-section">
                        <h3>Help & FAQ</h3>
                        <div class="faq-list">
                            <div class="faq-item">
                                <h4>How do I sign in?</h4>
                                <p>Click the "Sign In" button in the left menu and then click "Sign In Now" to register your presence.</p>
                            </div>
                            <div class="faq-item">
                                <h4>How do I send kudos?</h4>
                                <p>Select "Send Kudos" from the menu, write your message, select one or more recipients, and click "Send Kudos".</p>
                            </div>
                            <div class="faq-item">
                                <h4>What are points and how do I earn them?</h4>
                                <p>Points are earned through various activities at The Curious Forge. You can earn points by attending classes, helping others, and participating in community events.</p>
                            </div>
                            <div class="faq-item">
                                <h4>How do I view my messages?</h4>
                                <p>Click "Your Messages" in the menu to see all messages. Unread messages appear at the top and can be marked as read.</p>
                            </div>
                            <div class="faq-item">
                                <h4>Need more help?</h4>
                                <p>Please ask a staff member for assistance with any questions not covered here.</p>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        width: 90%;
        height: 90%;
        background: #ffffff;
        border-radius: 12px;
        display: flex;
        overflow: hidden;
        position: relative;
    }

    .modal-sidebar {
        width: 300px;
        background: white;
        padding: 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        border-right: 1px solid #eee;
    }

    .member-avatar {
        width: 150px;
        height: 150px;
        border-radius: 50%;
        object-fit: cover;
        margin-bottom: 1.5rem;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .modal-sidebar h2 {
        margin: 0;
        text-align: center;
        font-size: 1.5rem;
        color: #333;
    }

    .member-status {
        margin: 1rem 0;
        text-align: center;
    }

    .status {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        background: #eee;
        font-size: 0.9rem;
        display: inline-block;
    }

    .status.active {
        background: #4CAF50;
        color: white;
    }

    .current-area {
        margin: 0.5rem 0 0;
        font-size: 0.9rem;
        color: #666;
    }

    .sign-in-time {
        margin: 0.25rem 0 0;
        font-size: 0.8rem;
        color: #4CAF50;
    }

    .dashboard-nav {
        width: 100%;
        margin-top: 2rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .nav-item {
        width: 100%;
        padding: 0.75rem 1rem;
        text-align: left;
        background: none;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
        color: #333;
    }

    .nav-item:hover {
        background: #f0f0f0;
    }
.nav-item.active {
    background: #4CAF50;
    color: white;
}

.notification-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #ff4444;
    color: white;
    border-radius: 50%;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    font-size: 0.8rem;
    font-weight: bold;
    margin-left: 8px;
}


    .modal-main {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .content-area {
        height: 100%;
        display: flex;
        flex-direction: column;
        min-height: 0;
        padding: 2rem;
    }

    /* All sections take full width */
    .sign-section,
    .messages-section,
    .stats-section,
    .help-section,
    .kudos-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        width: 100%;
        padding-bottom: 2rem;
    }

    .content-area h3 {
        margin: 0 0 1.5rem 0;
        color: #333;
        font-size: 1.5rem;
    }

    .content-area h4 {
        margin: 1.5rem 0 1rem 0;
        color: #444;
        font-size: 1.2rem;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .stat-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .stat-value {
        display: block;
        font-size: 1.5rem;
        font-weight: 600;
        color: #4CAF50;
    }

    .stat-label {
        display: block;
        font-size: 0.9rem;
        color: #666;
        margin-top: 0.25rem;
    }

    .activities-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
    }

    .activities-list li {
        background: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.9rem;
        color: #333;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .kudos-section {
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .kudos-form {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        height: calc(100% - 4rem); /* Account for kudos-section padding */
        margin-top: 1rem;
    }

    .kudos-form textarea {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #ddd;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        resize: vertical;
        font-family: inherit;
    }

    .search-bar {
        margin-bottom: 1rem;
    }

    .search-input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #ddd;
        border-radius: 0.5rem;
        font-size: 1rem;
        transition: border-color 0.2s;
    }

    .search-input:focus {
        outline: none;
        border-color: #4CAF50;
    }

    .search-input::placeholder {
        color: #999;
    }

    .selected-recipients {
        background: #f9f9f9;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
    }

    .selected-label {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
    }

    .selected-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .selected-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #E8F5E9;
        color: #2E7D32;
        border: 1px solid #4CAF50;
        border-radius: 20px;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .selected-tag:hover {
        background: #C8E6C9;
    }

    .remove-tag {
        font-size: 1.2rem;
        font-weight: bold;
        line-height: 1;
    }

    .recipients-selection {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        margin: 1rem 0;
    }

    .recipients-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        overflow-y: auto;
        flex: 1;
        min-height: 0;
        padding-right: 0.5rem;
    }

    .recipients-grid::-webkit-scrollbar {
        width: 8px;
    }

    .recipients-grid::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }

    .recipients-grid::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 4px;
    }

    .recipients-grid::-webkit-scrollbar-thumb:hover {
        background: #999;
    }

    .recipient-card {
        padding: 0.75rem;
        border: 2px solid #ddd;
        border-radius: 0.5rem;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
    }

    .recipient-card.selected {
        border-color: #4CAF50;
        background: #E8F5E9;
    }

    .recipient-card:hover {
        border-color: #4CAF50;
    }

    .send-kudos-button {
        width: 100%;
        padding: 0.75rem;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.2s;
    }

    .send-kudos-button:disabled {
        background: #ccc;
        cursor: not-allowed;
    }

    .messages-container {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .message-group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .message-card {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        border: 2px solid transparent;
    }

    .message-card.unread {
        border-left: 4px solid #4CAF50;
    }

    .message-card.important {
        border-color: #ff4444;
        background: #fff8f8;
    }

    .message-content {
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
        color: #333;
    }

    .message-time {
        margin: 0;
        font-size: 0.8rem;
        color: #666;
    }

    .mark-read-button {
        margin-top: 0.5rem;
        padding: 0.5rem 1rem;
        background: none;
        border: 1px solid #4CAF50;
        color: #4CAF50;
        border-radius: 0.25rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .mark-read-button:hover {
        background: #4CAF50;
        color: white;
    }

    .kudos-stats {
        margin-top: 2rem;
    }

    .kudos-summary {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }

    .kudos-stat {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .help-section .faq-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .faq-item {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .faq-item h4 {
        margin: 0 0 0.5rem 0;
        color: #333;
    }

    .faq-item p {
        margin: 0;
        color: #666;
        line-height: 1.4;
    }

    .activities-form {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        height: calc(100% - 4rem); /* Account for sign-section padding and title */
        margin-top: 1rem;
    }

    .activities-header {
        flex-shrink: 0;
        margin-bottom: 1rem;
    }

    .activities-footer {
        flex-shrink: 0;
        margin-top: 1rem;
    }

    .footer-content {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .footer-content .error-message {
        margin: 0;
        flex: 1;
        text-align: left;
        font-size: 0.9rem;
        color: #666;
    }

    .action-button.disabled {
        background: #ccc;
        cursor: not-allowed;
    }

    .scrollable {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        padding-right: 0.5rem;
    }

    .scrollable::-webkit-scrollbar {
        width: 8px;
    }

    .scrollable::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }

    .scrollable::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 4px;
    }

    .scrollable::-webkit-scrollbar-thumb:hover {
        background: #999;
    }

    .instructions {
        margin: 0 0 1rem 0;
        color: #666;
    }

    .total-percentage {
        text-align: center;
        font-size: 1.2rem;
        font-weight: 600;
        padding: 0.5rem;
        margin-bottom: 1rem;
        border-radius: 0.5rem;
        background: #f5f5f5;
    }

    .total-percentage.warning {
        color: #f44336;
        background: #ffebee;
    }

    .total-percentage.valid {
        color: #4CAF50;
        background: #E8F5E9;
    }

    .activity-item {
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f9f9f9;
        border-radius: 0.5rem;
    }

    .activity-item label {
        display: block;
        margin-bottom: 0.5rem;
        color: #333;
        font-weight: 500;
    }

    .slider-group {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .slider-group input[type="range"] {
        flex: 1;
        height: 8px;
        -webkit-appearance: none;
        background: #ddd;
        border-radius: 4px;
        outline: none;
    }

    .slider-group input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        background: #4CAF50;
        border-radius: 50%;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .slider-group input[type="range"]::-webkit-slider-thumb:hover {
        background: #388E3C;
    }

    .percentage-value {
        min-width: 4rem;
        text-align: right;
        font-weight: 500;
        color: #4CAF50;
    }

    .error-message {
        color: #f44336;
        text-align: center;
        margin-top: 1rem;
        font-size: 0.9rem;
    }

    .action-button {
        padding: 1rem 2rem;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 0.5rem;
        font-size: 1.1rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .action-button:hover {
        background: #388E3C;
    }

    .sign-in-section {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .member-types {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .member-type-buttons {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-top: 1rem;
    }

    .member-type-button {
        padding: 1rem;
        border: 2px solid #ddd;
        border-radius: 8px;
        background: white;
        color: #333;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .member-type-button:hover {
        border-color: #4CAF50;
        background: #f5f5f5;
    }

    .member-type-button.selected {
        border-color: #4CAF50;
        background: #E8F5E9;
        color: #2E7D32;
    }

    .no-data {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 2rem;
        background: white;
        border-radius: 8px;
    }

    @media (max-width: 768px) {
        .modal-content {
            flex-direction: column;
            width: 95%;
            height: 95%;
        }

        .modal-sidebar {
            width: 100%;
            padding: 1rem;
        }

        .stats-grid {
            grid-template-columns: 1fr;
        }

        .kudos-summary {
            grid-template-columns: 1fr;
        }
    }
</style>
