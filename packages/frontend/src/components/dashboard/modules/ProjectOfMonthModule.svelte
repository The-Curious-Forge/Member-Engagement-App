<script lang="ts">
    import type { ModuleConfig } from '../../../types/dashboard';
    import { monthlyRecognition } from '../../../stores/appStore';
    
    export let config: ModuleConfig;
    export let isExpanded: boolean;

    $: recognition = $monthlyRecognition;

    let currentPhotoIndex = 0;

    function nextPhoto() {
        if (recognition?.projectPhotos) {
            currentPhotoIndex = (currentPhotoIndex + 1) % recognition.projectPhotos.length;
        }
    }

    function prevPhoto() {
        if (recognition?.projectPhotos) {
            currentPhotoIndex = (currentPhotoIndex - 1 + recognition.projectPhotos.length) % recognition.projectPhotos.length;
        }
    }
</script>

<div class="recognition-card project">
    {#if recognition?.projectOfTheMonth}
        <div class="project-content">
            {#if isExpanded}
                <div class="expanded-view">
                    <div class="expanded-content">
                        <div class="gallery-side">
                            {#if recognition.projectPhotos && recognition.projectPhotos.length > 0}
                                <div class="gallery-section">
                                    <div class="gallery-container">
                                        <button class="gallery-nav prev" on:click={prevPhoto}>←</button>
                                        <div class="main-photo-container">
                                            <img
                                                src={recognition.projectPhotos[currentPhotoIndex]}
                                                alt="Project photo {currentPhotoIndex + 1}"
                                                class="main-photo"
                                            />
                                        </div>
                                        <button class="gallery-nav next" on:click={nextPhoto}>→</button>
                                    </div>
                                    <div class="photo-thumbnails">
                                        {#each recognition.projectPhotos as photo, index}
                                            <button
                                                class="thumbnail-button"
                                                class:active={index === currentPhotoIndex}
                                                on:click={() => currentPhotoIndex = index}
                                            >
                                                <img
                                                    src={photo}
                                                    alt="Thumbnail {index + 1}"
                                                    class="thumbnail"
                                                />
                                            </button>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                        <div class="details-side">
                            <div class="project-header">
                                <h3 class="project-name-expanded">{recognition.projectOfTheMonth}</h3>
                                <p class="project-description-expanded">{recognition.projectDescription}</p>
                            </div>

                            {#if recognition.projectMembers && recognition.projectMembers.length > 0}
                                <div class="team-section">
                                    <h4 class="team-title">Members Who Working on this</h4>
                                    <div class="team-members-expanded">
                                        {#each recognition.projectMembers as member}
                                            <div class="team-member-expanded">
                                                {#if member.headshot}
                                                    <img
                                                        src={member.headshot}
                                                        alt={member.name}
                                                        class="member-avatar-expanded"
                                                    />
                                                {/if}
                                                <span class="member-name-expanded">{member.name}</span>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            {:else}
                <div class="collapsed-view">
                    <h4 class="project-name">{recognition.projectOfTheMonth}</h4>
                    {#if recognition.projectPhotos && recognition.projectPhotos.length > 0}
                        <div class="project-preview">
                            <img
                                src={recognition.projectPhotos[0]}
                                alt={recognition.projectOfTheMonth}
                                class="preview-image"
                            />
                            {#if recognition.projectPhotos.length > 1}
                                <div class="photo-count">+{recognition.projectPhotos.length - 1}</div>
                            {/if}
                        </div>
                    {/if}
                    {#if recognition.projectMembers && recognition.projectMembers.length > 0}
                        <div class="team-preview">
                            <div class="avatar-stack">
                                {#each recognition.projectMembers.slice(0, 3) as member}
                                    {#if member.headshot}
                                        <img
                                            src={member.headshot}
                                            alt={member.name}
                                            class="member-avatar"
                                        />
                                    {/if}
                                {/each}
                                {#if recognition.projectMembers.length > 3}
                                    <div class="avatar-more">+{recognition.projectMembers.length - 3}</div>
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    {:else}
        <p class="no-data">No project of the month selected</p>
    {/if}
</div>

<style>
    .recognition-card {
        background: white;
        border-radius: 0.5rem;
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .project-content {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    /* Collapsed view styles */
    .collapsed-view {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 0.75rem;
    }

    .project-preview {
        position: relative;
        width: 100%;
        height: 10rem;
        border-radius: 0.75rem;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .preview-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .photo-count {
        position: absolute;
        bottom: 0.5rem;
        right: 0.5rem;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;
        font-size: 0.75rem;
    }

    .project-name {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #2c3e50;
        padding: 0 0.25rem;
    }

    .team-preview {
        margin-top: auto;
    }

    .avatar-stack {
        display: flex;
        align-items: center;
    }

    .member-avatar {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid white;
        margin-left: -0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .member-avatar:first-child {
        margin-left: 0;
    }

    .avatar-more {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        background: #f0f0f0;
        color: #666;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        margin-left: -0.5rem;
        border: 2px solid white;
    }

    /* Expanded view styles */
    .expanded-view {
        height: 100%;
        padding: 1.5rem;
    }

    .expanded-content {
        display: flex;
        gap: 2rem;
        height: 100%;
    }

    .gallery-side {
        flex: 0 0 60%;
        height: 100%;
        display: flex;
    }

    .details-side {
        flex: 0 0 40%;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        overflow-y: auto;
    }

    .project-header {
        padding: 1.5rem;
        background: linear-gradient(145deg, #ffffff, #f8f9fa);
        border-radius: 1rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        flex-shrink: 0;
    }

    .project-name-expanded {
        margin: 0 0 1rem 0;
        font-size: 1.75rem;
        font-weight: 600;
        color: #2c3e50;
    }

    .project-description-expanded {
        font-size: 1.1rem;
        color: #4a5568;
        line-height: 1.6;
        margin: 0;
    }

    .gallery-section {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 70vh;
    }

    .gallery-container {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 1rem;
        position: relative;
        min-height: 0;
    }

    .main-photo-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .main-photo {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        object-fit: contain;
        transition: transform 0.3s ease;
    }

    .main-photo:hover {
        transform: scale(1.02);
    }

    .gallery-nav {
        background: rgba(255, 255, 255, 0.9);
        border: none;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        color: #2c3e50;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .gallery-nav:hover {
        background: white;
        transform: scale(1.1);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .photo-thumbnails {
        display: flex;
        gap: 0.75rem;
        overflow-x: auto;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 0.75rem;
        margin-top: 0.5rem;
        flex-shrink: 0;
        backdrop-filter: blur(4px);
    }

    .thumbnail-button {
        border: none;
        padding: 0;
        background: none;
        cursor: pointer;
        transition: transform 0.2s ease;
        opacity: 0.7;
    }

    .thumbnail-button:hover {
        transform: translateY(-2px);
        opacity: 0.9;
    }

    .thumbnail-button.active {
        opacity: 1;
        transform: scale(1.05);
    }

    .thumbnail {
        width: 4rem;
        height: 4rem;
        border-radius: 0.25rem;
        object-fit: cover;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .team-section {
        padding: 1.5rem;
        background: linear-gradient(145deg, #ffffff, #f8f9fa);
        border-radius: 1rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .team-title {
        font-size: 1.25rem;
        color: #2c3e50;
        margin: 0 0 1rem 0;
    }

    .team-members-expanded {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
    }

    .team-member-expanded {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .member-avatar-expanded {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        object-fit: cover;
    }

    .member-name-expanded {
        font-size: 1rem;
        color: #2c3e50;
        font-weight: 500;
    }

    .no-data {
        color: #666;
        font-style: italic;
        text-align: center;
        margin: 1rem 0;
    }
</style>