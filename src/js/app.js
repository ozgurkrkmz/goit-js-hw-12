import axios from 'axios';
import iziToast from "izitoast";
import "izitoast/dist/css/iziToast.min.css";
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";

const API_KEY = "48286639-c5b13cd121e9f124dcf0b461d";
const BASE_URL = "https://pixabay.com/api/";
let lightbox;
let pageNum = 1;
let searchQuery = "";
let totalImages = 0;
const imagesPerPage = 40;

const gallery = document.querySelector('.gallery');
const searchForm = document.querySelector('.searchForm');
const loaderOverlay = document.getElementById('loaderOverlay');
const loader = document.getElementById('loader');
const loadBtnContainer = document.querySelector('.load-btn-container');
const loadMoreBtn = document.createElement('button');
loadMoreBtn.textContent = 'Load more';
loadMoreBtn.classList.add('load-btn');
loadBtnContainer.appendChild(loadMoreBtn);

function showLoader() {
  loaderOverlay.classList.add('active');
  loader.classList.remove('loader-hidden');
}

function hideLoader() {
  loaderOverlay.classList.remove('active');
  loader.classList.add('loader-hidden');
}

function hideLoadBtn() {
  loadMoreBtn.style.display = 'none';
}

function showLoadBtn() {
  loadMoreBtn.style.display = 'block';
}

function scrollPage() {
  const galleryItem = document.querySelector('.gallery-item');
  if (!galleryItem) return;
  
  const cardHeight = galleryItem.getBoundingClientRect().height;
  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth'
  });
}

async function getImages(query, page) {
  const params = new URLSearchParams({
    key: API_KEY,
    q: query,
    image_type: "photo",
    orientation: "horizontal",
    safesearch: true,
    per_page: imagesPerPage,
    page: page
  });

  try {
    const response = await axios.get(`${BASE_URL}?${params}`);
    return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
}

function displayImages(images) {
  const markup = images.map(({ webformatURL, largeImageURL, tags, likes, views, comments, downloads }) => 
    `<li class="gallery-item">
      <a class="gallery-link" href="${largeImageURL}">
        <img
          class="gallery-image"
          src="${webformatURL}"
          alt="${tags}"
          title="${tags}"
        />
        <ul class="img-information">
          <li>
            <span class="img-information-title">Likes</span>
            <span class="img-information-content">${likes}</span>
          </li>
          <li>
            <span class="img-information-title">View</span>
            <span class="img-information-content">${views}</span>
          </li>
          <li>
            <span class="img-information-title">Comments</span>
            <span class="img-information-content">${comments}</span>
          </li>
          <li>
            <span class="img-information-title">Downloads</span>
            <span class="img-information-content">${downloads}</span>
          </li>
        </ul>
      </a>
    </li>`
  ).join('');

  gallery.insertAdjacentHTML('beforeend', markup);
  
  if (lightbox) {
    lightbox.refresh();
  } else {
    lightbox = new SimpleLightbox('.gallery a', {
      captions: true,
      captionSelector: 'img',
      captionType: 'attr',
      captionsData: 'title',
      captionPosition: 'bottom',
      captionDelay: 250,
      closeText: '×',
      navText: ['&larr;', '&rarr;'],
      overlayOpacity: 0.9,
      spinner: true,
      alertError: false
    });
  }
}

async function onFormSubmit(e) {
  e.preventDefault();
  showLoader();
  hideLoadBtn();
  
  const searchInput = document.querySelector('.search-input');
  const query = searchInput.value.trim();
  
  if (!query) {
    hideLoader();
    iziToast.warning({
      message: "Please enter a search term",
      position: "topRight"
    });
    return;
  }

  gallery.innerHTML = '';
  searchQuery = query;
  pageNum = 1;

  try {
    const data = await getImages(searchQuery, pageNum);
    totalImages = data.totalHits;
    
    if (data.hits.length === 0) {
      iziToast.warning({
        message: "Sorry, there are no images matching your search query. Please try again!",
        position: "topRight"
      });
      return;
    }
    
    displayImages(data.hits);
    
    if (data.totalHits > imagesPerPage) {
      showLoadBtn();
    }
  } catch (error) {
    iziToast.error({
      title: 'Error',
      message: `Something went wrong: ${error.message}`,
      position: 'topRight'
    });
  } finally {
    hideLoader();
    searchForm.reset();
  }
}

async function onLoadMoreClick() {
  showLoader();
  pageNum++;
  
  try {
    const data = await getImages(searchQuery, pageNum);
    displayImages(data.hits);
    
    if (pageNum * imagesPerPage >= totalImages) {
      hideLoadBtn();
      iziToast.info({
        message: "We're sorry, but you've reached the end of search results.",
        position: 'topRight'
      });
    }
    
    scrollPage();
  } catch (error) {
    iziToast.error({
      title: 'Error',
      message: `Something went wrong: ${error.message}`,
      position: 'topRight'
    });
  } finally {
    hideLoader();
  }
}

searchForm.addEventListener('submit', onFormSubmit);
loadMoreBtn.addEventListener('click', onLoadMoreClick);
hideLoadBtn();