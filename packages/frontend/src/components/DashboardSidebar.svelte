<script lang="ts">
import { activeMemberCount } from '../stores/appStore';
import { page } from '$app/stores';
import HomeIcon from '../assets/icons/home.svg';
import BellIcon from '../assets/icons/bell.svg';
import StarIcon from '../assets/icons/star.svg';
import CalendarIcon from '../assets/icons/calendar.svg';

// Export the component
export {};
</script>

<aside class="sidebar">
    <div class="logo">
        <h1>The Curious Forge</h1>
    </div>

    <nav>
        <ul>
            <li>
                <a href="/" class="nav-item" class:active={$page.url.pathname === '/'}>
                    <span class="icon">
                        <img src={HomeIcon} alt="Home" />
                    </span>
                    <span class="nav-text">Home</span>
                </a>
            </li>
            <li>
                <a href="/alerts" class="nav-item" class:active={$page.url.pathname === '/alerts'}>
                    <span class="icon">
                        <img src={BellIcon} alt="Alerts" />
                    </span>
                    <span class="nav-text">Alerts</span>
                </a>
            </li>
            <li>
                <a href="/kudos" class="nav-item" class:active={$page.url.pathname === '/kudos'}>
                    <span class="icon">
                        <img src={StarIcon} alt="Kudos" />
                    </span>
                    <span class="nav-text">Kudos</span>
                </a>
            </li>
            <li>
                <a href="/calendar" class="nav-item" class:active={$page.url.pathname === '/calendar'}>
                    <span class="icon">
                        <img src={CalendarIcon} alt="Calendar" />
                    </span>
                    <span class="nav-text">Calendar</span>
                </a>
            </li>
        </ul>
    </nav>

    <div class="active-members">
        <h2>Active Members</h2>
        <p class="count">{$activeMemberCount}</p>
    </div>
</aside>

<style>
    .sidebar {
        background: #1a1a1a;
        color: #ffffff;
        height: 100vh;
        width: 250px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .logo h1 {
        font-size: 1.5rem;
        margin: 0;
        padding: 1rem 0;
        text-align: center;
        border-bottom: 1px solid #333;
    }

    nav ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .nav-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem 1rem;
        color: #ffffff;
        text-decoration: none;
        border-radius: 0.5rem;
        transition: all 0.2s;
        position: relative;
    }

    .nav-item:hover {
        background-color: #333;
    }

    .nav-item.active {
        background-color: #333;
        font-weight: 500;
    }

    .nav-item.active::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background-color: #4a9eff;
        border-radius: 0 4px 4px 0;
    }

    .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
    }

    .icon img {
        width: 24px;
        height: 24px;
        filter: invert(1);
    }

    .nav-text {
        font-size: 1.1rem;
    }

    .active-members {
        margin-top: auto;
        padding: 1rem;
        background: #333;
        border-radius: 0.5rem;
        text-align: center;
    }

    .active-members h2 {
        font-size: 1rem;
        margin: 0 0 0.5rem 0;
    }

    .count {
        font-size: 2rem;
        font-weight: bold;
        margin: 0;
    }
</style>