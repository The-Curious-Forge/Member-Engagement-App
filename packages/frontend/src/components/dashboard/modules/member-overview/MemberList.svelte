<script lang="ts">
    import { members } from '../../../../stores/appStore';
    import type { Member } from '../../../../stores/appStore';
    import SignInOutForm from './SignInOutForm.svelte';
    import MessagesView from './MessagesView.svelte';
    import KudosForm from './KudosForm.svelte';
    
    export let onMemberSelect: (member: Member) => void;
    
    let searchTerm = '';
    let debounceTimeout: ReturnType<typeof setTimeout>;
    let selectedMember: Member | null = null;
    let activeTab: 'sign' | 'messages' | 'kudos' = 'sign';

    function handleMemberSelect(member: Member) {
        selectedMember = member;
        onMemberSelect(member);
    }

    function closeSelectedMember() {
        selectedMember = null;
    }

    type SortType = 'Last Signed In' | 'First Name' | 'Last Name' | 'Forge Points';
    const sortTypes: SortType[] = ['Last Signed In', 'First Name', 'Last Name', 'Forge Points'];
    let currentSort: SortType = 'Last Signed In';

    // Reset sort to "Last Signed In" whenever members are updated (sync)
    $: {
        $members; // trigger on members store changes
        currentSort = 'Last Signed In';
    }

    // Sorting functions
    function sortBySignInTime(a: Member, b: Member): number {
        if (!a.signInTime || !b.signInTime) return 0;
        const timeA = a.signInTime instanceof Date ? a.signInTime : new Date(a.signInTime);
        const timeB = b.signInTime instanceof Date ? b.signInTime : new Date(b.signInTime);
        return timeB.getTime() - timeA.getTime();
    }

    function sortByFirstName(a: Member, b: Member): number {
        const firstNameA = a.name.split(' ')[0];
        const firstNameB = b.name.split(' ')[0];
        return firstNameA.localeCompare(firstNameB);
    }

    function sortByLastName(a: Member, b: Member): number {
        const lastNameA = a.name.split(' ').slice(-1)[0];
        const lastNameB = b.name.split(' ').slice(-1)[0];
        return lastNameA.localeCompare(lastNameB);
    }

    function sortByForgePoints(a: Member, b: Member): number {
        return (b.totalPoints || 0) - (a.totalPoints || 0);
    }

    // Get sort function based on current sort type
    function getSortFunction(sortType: SortType): (a: Member, b: Member) => number {
        switch (sortType) {
            case 'Last Signed In':
                return sortBySignInTime;
            case 'First Name':
                return sortByFirstName;
            case 'Last Name':
                return sortByLastName;
            case 'Forge Points':
                return sortByForgePoints;
            default:
                return sortBySignInTime;
        }
    }

    // Filter members by search term
    $: filteredMembers = $members.filter(member => {
        if (!searchTerm || searchTerm.length < 2) return member.isActive;
        
        const searchLower = searchTerm.toLowerCase();
        const names = member.name.split(' ');
        const firstName = names[0].toLowerCase();
        const lastName = names[names.length - 1].toLowerCase();
        
        return firstName.startsWith(searchLower) || lastName.startsWith(searchLower);
    });

    // Determine if we should show inactive members
    $: showInactiveMembers = searchTerm && searchTerm.length >= 2 && inactiveMembers.length > 0;

    // Split into active and inactive members and apply sort
    $: activeMembers = filteredMembers
        .filter(member => member.isActive)
        .sort(getSortFunction(currentSort));

    $: inactiveMembers = filteredMembers
        .filter(member => !member.isActive)
        .sort(getSortFunction(currentSort));

    // Format time to show actual time
    function formatSignInTime(signInTime: Date | string): string {
        const timeDate = signInTime instanceof Date ? signInTime : new Date(signInTime);
        return timeDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).toLowerCase();
    }

    // Handle search input with debounce
    function handleSearch(event: Event) {
        const input = event.target as HTMLInputElement;
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            searchTerm = input.value;
        }, 300);
    }

    // Group members by area
    $: membersByArea = activeMembers.reduce((acc, member) => {
        const area = member.currentArea || 'Unknown Area';
        if (!acc[area]) {
            acc[area] = [];
        }
        acc[area].push(member);
        return acc;
    }, {} as Record<string, Member[]>);

    // Helper function to pluralize member type
    function pluralizeMemberType(type: string): string {
        const lowerType = type.toLowerCase();
        if (lowerType === 'staff') return 'Staff';
        if (lowerType === 'member') return 'Members';
        return `${type}s`;
    }

    // Group members by type
    $: membersByTypeMap = activeMembers.reduce((acc, member) => {
        const type = member.currentMemberType?.group || 'Other';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(member);
        return acc;
    }, {} as Record<string, Member[]>);

    // Sort member types (ensuring 'member' is first)
    $: membersByType = Object.entries(membersByTypeMap).sort(([typeA], [typeB]) => {
        if (typeA.toLowerCase() === 'member') return -1;
        if (typeB.toLowerCase() === 'member') return 1;
        return typeA.localeCompare(typeB);
    }) as Array<[string, Member[]]>;

    // Cleanup on destroy
    import { onDestroy } from 'svelte';
    onDestroy(() => {
        clearTimeout(debounceTimeout);
    });
</script>

<div class="member-list">
    <div class="controls-container">
        <div class="search-container">
            <input
                type="text"
                placeholder="Search..."
                bind:value={searchTerm}
                on:input={handleSearch}
                class="search-input"
            />
        </div>
        <div class="sort-container">
            <label for="member-sort" class="sort-label">Sort by:</label>
            <select
                id="member-sort"
                bind:value={currentSort}
                class="sort-select"
            >
                {#each sortTypes as sortType}
                    <option value={sortType}>{sortType}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="active-members-container">
        <div class="summary-view">
            <div class="member-columns">
                    <!-- Signed Out Members Column (only shown when there's a relevant search) -->
                    {#if showInactiveMembers}
                        <div class="member-column">
                            <div class="column-header">
                                <span class="column-title">Signed Out Members</span>
                                <span class="column-count">{inactiveMembers.length}</span>
                            </div>
                            <div class="column-members">
                                {#each inactiveMembers as member (member.id)}
                                    <button
                                        class="member-chip inactive"
                                        class:selected={selectedMember?.id === member.id}
                                        on:click={() => handleMemberSelect(member)}
                                    >
                                        <div class="member-chip-content">
                                            <div class="member-chip-main">
                                                {#if member.headshot}
                                                    <img
                                                        src={member.headshot}
                                                        alt={member.name}
                                                        class="member-avatar"
                                                    />
                                                {/if}
                                                <div class="member-chip-info">
                                                    <span class="member-name">{member.name}</span>
                                                    {#if member.forgeLevel}
                                                        <span class="forge-level">{member.forgeLevel}</span>
                                                    {/if}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <!-- Signed In Members Columns -->
                    {#each membersByType as [type, typeMembers]}
                        <div class="member-column">
                            <div class="column-header">
                                <span class="column-title">Signed in {pluralizeMemberType(type)}</span>
                                <span class="column-count">{typeMembers.length}</span>
                            </div>
                            <div class="column-members">
                                {#each typeMembers as member (member.id)}
                                    <button
                                        class="member-chip"
                                        class:selected={selectedMember?.id === member.id}
                                        on:click={() => handleMemberSelect(member)}
                                    >
                                        <div class="member-chip-content">
                                            <div class="member-chip-main">
                                                {#if member.headshot}
                                                    <img
                                                        src={member.headshot}
                                                        alt={member.name}
                                                        class="member-avatar"
                                                    />
                                                {/if}
                                                <div class="member-chip-info">
                                                    <span class="member-name">{member.name}</span>
                                                    {#if member.forgeLevel}
                                                        <span class="forge-level">{member.forgeLevel}</span>
                                                    {/if}
                                                </div>
                                            </div>
                                            {#if member.signInTime}
                                                <span class="time-badge">{formatSignInTime(member.signInTime)}</span>
                                            {/if}
                                        </div>
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>

                {#if selectedMember}
                    <div class="member-actions">
                        <div class="member-actions-header">
                            <h3>{selectedMember.name}</h3>
                            <button class="close-button" on:click={closeSelectedMember}>×</button>
                        </div>
                        <div class="member-actions-tabs">
                            <button
                                class="tab-button"
                                class:active={activeTab === 'sign'}
                                on:click={() => activeTab = 'sign'}
                            >
                                Sign In/Out
                            </button>
                            <button
                                class="tab-button"
                                class:active={activeTab === 'messages'}
                                on:click={() => activeTab = 'messages'}
                            >
                                Messages
                            </button>
                            <button
                                class="tab-button"
                                class:active={activeTab === 'kudos'}
                                on:click={() => activeTab = 'kudos'}
                            >
                                Kudos
                            </button>
                        </div>
                        <div class="member-actions-content">
                            {#if activeTab === 'sign'}
                                <SignInOutForm
                                    member={selectedMember}
                                    onComplete={closeSelectedMember}
                                />
                            {:else if activeTab === 'messages'}
                                <MessagesView member={selectedMember} />
                            {:else if activeTab === 'kudos'}
                                <KudosForm member={selectedMember} />
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
    </div>
</div>

<style>
    .member-list {
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .controls-container {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .search-container {
        position: relative;
        flex: 1;
    }

    .sort-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .sort-label {
        font-size: 0.875rem;
        color: #666;
        white-space: nowrap;
    }

    .sort-select {
        width: 180px;
        padding: 0.75rem;
        border: 2px solid #ddd;
        border-radius: 0.5rem;
        font-size: 1rem;
        background-color: white;
        cursor: pointer;
        transition: border-color 0.2s;
    }

    .sort-select:focus {
        outline: none;
        border-color: #4CAF50;
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

    .search-results {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        margin-top: 0.5rem;
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;
    }

    .member-result {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.75rem;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .member-result:hover {
        background-color: #f5f5f5;
    }

    .active-badge {
        font-size: 0.75rem;
        color: #4CAF50;
        background: #e8f5e9;
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;
        margin-top: 0.25rem;
    }

    .active-members-container {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .summary-view {
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .count-display {
        text-align: center;
    }

    .count {
        font-size: 2rem;
        font-weight: 600;
        color: #4CAF50;
    }

    .label {
        display: block;
        font-size: 0.875rem;
        color: #666;
    }

    .member-columns {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
        align-items: start;
        height: 100%;
        min-height: 0;
    }

    .member-column {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        min-width: 0;
        height: 100%;
        position: relative;
    }

    .column-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0.75rem;
        background: #f5f5f5;
        border-radius: 0.5rem;
        position: sticky;
        top: 0;
        z-index: 1;
    }

    .column-title {
        font-weight: 600;
        color: #333;
    }

    .column-count {
        font-size: 0.875rem;
        color: #666;
        background: white;
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;
    }

    .column-members {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        overflow-y: auto;
        padding-right: 0.5rem;
        margin-right: -0.5rem;
        flex: 1;
        min-height: 0;
    }

    .column-members::-webkit-scrollbar {
        width: 6px;
    }

    .column-members::-webkit-scrollbar-track {
        background: #f0f0f0;
        border-radius: 3px;
    }

    .column-members::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 3px;
    }

    .column-members::-webkit-scrollbar-thumb:hover {
        background: #999;
    }

    .member-chip {
        display: flex;
        padding: 1rem;
        background: white;
        border-radius: 0.75rem;
        border: 1px solid rgba(0, 0, 0, 0.05);
        width: 100%;
        text-align: left;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    }

    .member-chip:hover {
        background: #e8f5e9;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
        border-color: rgba(76, 175, 80, 0.1);
    }

    .member-chip.inactive {
        opacity: 1;
        background: #f8f8f8;
    }

    .member-chip.inactive .member-name {
        color: #666;
    }

    .member-chip.inactive .forge-level {
        color: #999;
    }

    .member-chip.inactive:hover {
        background: #f0f0f0;
        border-color: rgba(0, 0, 0, 0.1);
        opacity: 0.8;
    }

    .member-chip-content {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }

    .member-chip-main {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
        min-width: 0;
    }

    .member-chip-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1;
        min-width: 0;
    }

    .member-avatar {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
    }

    .forge-level {
        font-size: 0.75rem;
        color: #666;
    }

    .time-badge {
        font-size: 0.75rem;
        color: #666;
        background: #f0f0f0;
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;
        white-space: nowrap;
    }

    .detailed-view {
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        overflow: hidden;
    }

    .stats-bar {
        display: flex;
        gap: 2rem;
        padding: 1rem;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .stat-value {
        font-size: 1.5rem;
        font-weight: 600;
        color: #4CAF50;
    }

    .stat-label {
        font-size: 0.875rem;
        color: #666;
    }

    .areas-list {
        flex: 1;
        overflow-y: auto;
    }

    .area-section {
        margin-bottom: 1.5rem;
    }

    .area-title {
        font-size: 1rem;
        font-weight: 600;
        color: #333;
        margin: 0 0 1rem 0;
    }

    .area-members {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
    }

    .member-card {
        background: white;
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        border: none;
        width: 100%;
        text-align: left;
        cursor: pointer;
        transition: all 0.2s;
    }

    .member-card:hover {
        background: #e8f5e9;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .member-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
    }

    .member-info {
        display: flex;
        flex-direction: column;
    }

    .member-name {
        font-size: 1.25rem;
        font-weight: 600;
        color: #333;
        line-height: 1.2;
        margin-bottom: 0.125rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .member-type {
        font-size: 0.875rem;
        color: #666;
    }

    .time-info {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
        color: #666;
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid #eee;
    }

    .time-label {
        color: #999;
    }

    .time-value {
        color: #4CAF50;
    }
    .member-chip.selected {
        background: #e8f5e9;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
        border-color: rgba(76, 175, 80, 0.1);
    }

    .member-actions {
        background: white;
        border-radius: 0.75rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        margin-top: 1.5rem;
        overflow: hidden;
    }

    .member-actions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: #f5f5f5;
        border-bottom: 1px solid #eee;
    }

    .member-actions-header h3 {
        margin: 0;
        font-size: 1.25rem;
        color: #333;
    }

    .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #666;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        line-height: 1;
    }

    .close-button:hover {
        color: #333;
    }

    .member-actions-tabs {
        display: flex;
        border-bottom: 1px solid #eee;
        background: #f9f9f9;
    }

    .tab-button {
        flex: 1;
        padding: 1rem;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        color: #666;
        cursor: pointer;
        transition: all 0.2s;
    }

    .tab-button:hover {
        background: #f0f0f0;
        color: #333;
    }

    .tab-button.active {
        color: #4CAF50;
        border-bottom-color: #4CAF50;
        background: white;
    }

    .member-actions-content {
        padding: 1.5rem;
        max-height: 400px;
        overflow-y: auto;
    }
</style>