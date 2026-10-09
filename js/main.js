//================
//Loading Images
//================
const currentImage = document.getElementById('current-image');
const imageLoader = document.querySelector('.image-loader');

// Show the image and hide the loader once it has loaded.
currentImage.addEventListener('load', () => {
    currentImage.classList.add('loaded');
    imageLoader.classList.add('hidden');
});

// Remember a loading failure so the assign form can show the right message.
currentImage.addEventListener('error', () => {
    photoLoadFailed = true;
    imageLoader.textContent = 'Unable to load the image. Please try again.';
});

const newImageButton = document.getElementById('btn-new-image');

// Track the requested seed, photo details, and loading status.
let currentSeed = null;
let currentPhoto = null;
let photoLoadFailed = false;

//========================
// Requesting A New Image
//========================
function loadNewImage() {
    // Reset the previous photo and show the loading state.
    currentPhoto = null;
    photoLoadFailed = false;
    currentImage.classList.remove('loaded');
    imageLoader.classList.remove('hidden');
    imageLoader.textContent = 'Loading...';

    // Keep a copy of this seed so old responses can be ignored.
    currentSeed = Math.floor(Math.random() * 1000000);
    const requestedSeed = currentSeed;

    currentImage.src = `https://picsum.photos/seed/${requestedSeed}/900/600`;

    // Get the photo ID and details used for assignments and previews.
    fetch(`https://picsum.photos/seed/${requestedSeed}/info`)
        .then((response) => {
            // Send unsuccessful HTTP responses to the catch block.
            if (!response.ok) {
                throw new Error('Unable to load photo details.');
            }
            return response.json();
        })
        .then((photo) => {
            // Ignore details for a photo that has already been replaced.
            if (requestedSeed !== currentSeed) {
                return;
            }
            currentPhoto = photo;
        })
        .catch((error) => {
            // An old request's error should not affect the newest photo.
            if (requestedSeed !== currentSeed) {
                return;
            }
            photoLoadFailed = true;

            feedback.textContent = 'Unable to load photo details. Please request a new image.';
            feedback.classList.remove('ok');
            feedback.classList.add('err');

            console.error('Unable to get photo details:', error);
        });
}

// Request another image when clicked, and load the first one on page opening.
newImageButton.addEventListener('click', loadNewImage);

loadNewImage();

//======================================
// Email Verification & Assigning Email
//======================================
const assignForm = document.getElementById('assign-form');
const emailInput = document.getElementById('email-input');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const feedback = document.getElementById('email-feedback');
// Each collection stores one email, its photos, avatar colour, and collapse state.
const collections = [];

assignForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = normaliseEmail(emailInput.value);

    // Check for an empty input, then check the email format.
    if (email === '') {
        feedback.textContent = 'Please enter an email address.';
        feedback.classList.remove('ok');
        emailInput.classList.remove('valid');
        feedback.classList.add('err');
        emailInput.classList.add('invalid');

    } else if (!emailInput.checkValidity() || !emailPattern.test(email)){
        feedback.textContent = 'Please enter a valid email address.';
        feedback.classList.remove('ok');
        emailInput.classList.remove('valid');
        feedback.classList.add('err');
        emailInput.classList.add('invalid');

    } else {
        feedback.classList.remove('ok', 'err');
        emailInput.classList.remove('invalid');
        emailInput.classList.add('valid');

        // Handle a failed request before checking whether the photo is still loading.
        if(photoLoadFailed) {
            feedback.textContent = 'Unable to load this photo. Please request a new image.';
            feedback.classList.add('err');
            return;
        }

        if (!currentPhoto || !currentImage.classList.contains('loaded')) {
            feedback.textContent = 'Please wait for the photo to finish loading.';
            return;
        }

        // Find this email's collection or create one if it does not exist.
        let collection = collections.find((item) => {
            return normaliseEmail(item.email) === email;
        });

        if (!collection) {
            collection = {
                email: email,
                images: [],
                avatarColor: (collections.length % 5) + 1,
                collapsed: false
            };
            collections.push(collection);
        }

        // Use the photo ID to block duplicates within this email's collection.
        const duplicateImage = collection.images.find((image) => {
            return image.id === currentPhoto.id;
        });

        if (duplicateImage) {
            feedback.textContent = 'This photo was already saved to this email.';
            feedback.classList.add('err');
            return;
        }

        // Add the photo, show confirmation, then save and redraw the gallery.
        collection.images.push(currentPhoto);

        feedback.textContent = '';
        showToast('Photo saved to this email.');

        saveCollections();
        renderGallery();
    }
});

function normaliseEmail(value) {
    const email = value.trim();
    const atPosition = email.lastIndexOf('@');

    if (atPosition === -1) {
        return email;
    }

    const firstPart = email.slice(0, atPosition + 1);
    const domain = email.slice(atPosition + 1).toLowerCase();

    return firstPart + domain;
}

//========================
// Displaying Collections
//========================
const gallery = document.getElementById('gallery');
const emptyState = document.getElementById('empty-state');
const statEmail = document.getElementById('stat-emails');
const statLinks = document.getElementById('stat-links');
const statImages = document.getElementById('stat-images');

function renderGallery() {
    // Clear the old elements before rebuilding the gallery from collections.
    gallery.textContent = '';

    // Show the empty state only when there are no email collections.
    if (collections.length > 0) {
        emptyState.classList.add('hidden');

    } else {
        emptyState.classList.remove('hidden');
    }

    // A Set counts each photo ID once; totalLinks counts every assignment.
    const uniqueImageIds = new Set();
    let totalLinks = 0;

    //===========================
    // Building Each Email Group
    //===========================
    collections.forEach((collection) => {
        const group = document.createElement('div');
        group.classList.add('group');

        // Restore this collection's open or closed state after a redraw.
        if (collection.collapsed) {
            group.classList.add('collapsed');
        }

        // Build the email header, avatar, photo count, and chevron.
        const header = document.createElement('button');
        header.type = 'button';
        header.classList.add('group-head');

        const avatar = document.createElement('span');
        avatar.classList.add('avatar');
        avatar.classList.add(`avatar-color-${collection.avatarColor}`);
        avatar.textContent = collection.email.charAt(0).toUpperCase();

        const emailLabel = document.createElement('span');
        emailLabel.classList.add('group-email');
        emailLabel.textContent = collection.email;

        // The body holds the thumbnail grid beneath the header.
        const body = document.createElement('div');
        body.classList.add('group-body');

        const thumbs = document.createElement('div');
        thumbs.classList.add('thumbs');

        const countBadge = document.createElement('span');
        countBadge.classList.add('count-badge');
        countBadge.textContent = collection.images.length;

        const chevron = document.createElement('span');
        chevron.classList.add('chev');
        chevron.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6"/>
        </svg>`;

        //=================================
        // Building Saved Photo Thumbnails
        //=================================
        collection.images.forEach((photo) => {
            // Check how many email collections contain this photo ID.
            const matchingCollections = collections.filter((item) => {
                return item.images.some((image) => {
                    return image.id === photo.id;
                });
            });

            const thumb = document.createElement('div');
            thumb.classList.add('thumb');

            // Add the Shared badge when this photo belongs to multiple emails.
            if (matchingCollections.length > 1) {
                thumb.classList.add('shared');
                const sharedBadge = document.createElement('span');
                sharedBadge.classList.add('shared-badge');
                sharedBadge.textContent = 'Shared';

                thumb.appendChild(sharedBadge);
            }

            // Use a button so the larger preview also opens with Enter or Space.
            const previewButton = document.createElement('button');
            previewButton.type = 'button';
            previewButton.classList.add('preview-photo');
            previewButton.setAttribute('aria-label', `View larger photo by ${photo.author}`);

            const image = document.createElement('img');
            image.src = `https://picsum.photos/id/${photo.id}/300/300`;
            image.alt = `Saved photo by ${photo.author}`;

            previewButton.addEventListener('click', () => {
                openPhotoModal(photo);
            });

            // This button removes only the assignment to this email.
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.classList.add('remove-photo');
            removeButton.textContent = '×';
            removeButton.setAttribute(
                'aria-label',
                `Remove photo by ${photo.author} from ${collection.email}`
            );

            //======================================
            // Removing A Photo And Restoring Focus
            //======================================
            removeButton.addEventListener('click', () => {
                // Remember the positions before changing the collections.
                const collectionIndex = collections.indexOf(collection);
                const photoIndex = collection.images.indexOf(photo);

                // Keep every photo except the one being removed.
                collection.images = collection.images.filter((image) => {
                    return image.id !== photo.id;
                });

                // Remove the email group when its final photo is deleted.
                if (collection.images.length === 0) {
                    collections.splice(collectionIndex, 1);
                }

                // Save the updated data before rebuilding the gallery.
                saveCollections();
                renderGallery();

                // Find a newly created group at this position, or the previous one.
                const groups = gallery.querySelectorAll('.group');
                const nextGroup = groups[collectionIndex] || groups[collectionIndex - 1];

                if (nextGroup) {
                    // Keep focus on a remove button while this collection has photos.
                    if (collection.images.length > 0) {
                        const removeButtons = nextGroup.querySelectorAll('.remove-photo');
                        const nextRemoveButton = removeButtons[photoIndex] || removeButtons[photoIndex - 1];

                        nextRemoveButton.focus();
                    } else {
                        // The collection disappeared, so focus a nearby email header.
                        nextGroup.querySelector('.group-head').focus();
                    }

                } else {
                    // No groups remain, so return focus to the email input.
                    emailInput.focus();
                }

                showToast('Photo removed from this email.');
            });

            // Keep the preview and remove buttons beside each other in the thumbnail.
            previewButton.appendChild(image);
            thumb.appendChild(previewButton);
            thumb.appendChild(removeButton);
            thumbs.appendChild(thumb);

            // Shared photos still count as one unique image.
            uniqueImageIds.add(photo.id);
        });

        //============================
        // Assembling The Email Group
        //============================
        body.appendChild(thumbs);

        header.appendChild(avatar);
        header.appendChild(emailLabel);
        header.appendChild(countBadge);
        header.appendChild(chevron);

        group.appendChild(header);
        group.appendChild(body);

        //====================================
        // Collapsing And Expanding The Group
        //====================================
        header.setAttribute('aria-expanded', !collection.collapsed);
        header.addEventListener('click', () => {
            // Remember and save the state, then update it for assistive technology.
            collection.collapsed = group.classList.toggle('collapsed');
            saveCollections();
            header.setAttribute('aria-expanded', !collection.collapsed);
        });
        gallery.appendChild(group);

        // Every saved photo in every collection contributes one link.
        totalLinks += collection.images.length;

    });

    // Update these counters after all collections have been counted.
    statEmail.textContent = `${collections.length} ${collections.length === 1 ? 'email' : 'emails'}`;
    statLinks.textContent = `${totalLinks} ${totalLinks === 1 ? 'link' : 'links'}`;
    statImages.textContent = `${uniqueImageIds.size} ${uniqueImageIds.size === 1 ? 'image' : 'images'}`;
}

//=================
//Clear All Button
//=================
const clearBtn = document.getElementById('btn-clear');

clearBtn.addEventListener('click', () => {
    // Empty the existing array, save it, and restore the empty gallery state.
    collections.length = 0;
    saveCollections();
    renderGallery();

    // Reset the form message and input border.
    feedback.textContent = '';
    feedback.classList.remove('ok', 'err');
    emailInput.classList.remove('valid', 'invalid');
});

//===================
//Toast Notification
//===================
const toast = document.getElementById('toast');

let toastTimeout;

function showToast(message) {
    // Cancel the previous timer so it cannot hide a newer notification.
    clearTimeout(toastTimeout);

    toast.textContent = message;
    toast.classList.add('show');
    // Hide the notification after 1.5 seconds.
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 1500);
}

//============
//Image Modal
//============
const photoModal = document.getElementById('photo-modal');
const modalImage = document.getElementById('modal-image');
const modalCaption = document.getElementById('modal-caption');
const closeModalButton = document.getElementById('btn-close-modal');

function openPhotoModal(photo) {
    // Request a larger image while keeping the original photo proportions.
    const previewWidth = Math.min(1200, photo.width);
    const previewHeight = Math.round(previewWidth * photo.height / photo.width);

    modalImage.src = `https://picsum.photos/id/${photo.id}/${previewWidth}/${previewHeight}`;
    modalImage.alt = `Photo by ${photo.author}`;
    modalCaption.textContent = `Photo by ${photo.author}`;

    photoModal.showModal();
}

// Close with the X button. The native dialog also handles Escape.
closeModalButton.addEventListener('click', () => {
    photoModal.close();
});

// Close on a backdrop click, while allowing clicks on the dialog's padding.
photoModal.addEventListener('click', (event) => {
    const bounds = photoModal.getBoundingClientRect();

    const clickedOutside =
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom;

    if (event.target === photoModal && clickedOutside) {
        photoModal.close();
    }
});

//=================
//Save Collections
//=================
function saveCollections() {
    // Store the current collection data as text in this browser.
    try {
        localStorage.setItem('photonest-collections', JSON.stringify(collections));
    } catch (error) {
        // Keep the gallery working if browser storage is unavailable.
        console.warn('Unable to save collections:', error);
    }
}

//==============================
// Restore Saved Collections
//==============================
function loadCollections() {
    try {
        const savedCollections = localStorage.getItem('photonest-collections');

        if (!savedCollections) {
            return;
        }

        const storedCollections = JSON.parse(savedCollections);

        if (!Array.isArray(storedCollections)) {
            return;
        }

        storedCollections.forEach((collection) => {
            collections.push(collection);
        });

    } catch (error) {
        console.warn('Unable to restore collections:', error);
    }
}

//==============================
// Restore Gallery On Page Load
//==============================
loadCollections();
renderGallery();