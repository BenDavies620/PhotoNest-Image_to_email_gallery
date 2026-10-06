//===================
//Loading Imaages
//===================
const currentImage = document.getElementById('current-image');
const imageLoader = document.querySelector('.image-loader');

currentImage.addEventListener('load', () => {
    currentImage.classList.add('loaded');
    imageLoader.classList.add('hidden');
});

currentImage.addEventListener('error', () => {
    imageLoader.textContent = 'Unable to load the image. Please try again.';
});

currentImage.src = 'https://picsum.photos/id/900/600';