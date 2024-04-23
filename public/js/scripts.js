var i=0;
function signin(){
    document.getElementById("booo").style.opacity ='0.15';
    document.querySelector('body').classList.add('home-overlay');
    document.getElementById("signin-bo").style.visibility = 'visible';
}

function outsid(){
    
    document.getElementById("booo").style.opacity ='1';
    document.querySelector('body').classList.remove('home-overlay');
    document.getElementById("signin-bo").style.visibility = 'hidden';
}
function dropdo(){
        document.getElementById("rr").style.visibility='visible';
    
}
function oooo(){
    document.getElementById("rr").style.visibility='visible';

}
function iii() {
  const element = document.getElementById("rr");
  if (element) {
    element.style.visibility = 'hidden';
  }
} 

function handleLikeButtonClick(blogId) {
  const likeBtn = document.getElementById('like-btn');
  const likesCount = document.getElementById('likes-count');

  // Send an AJAX request to the server to like/unlike the post
  const xhr = new XMLHttpRequest();
  xhr.open('POST', `/home/${blogId}/likes`);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        // Update the UI to reflect the updated likes count and button icon
        const response = JSON.parse(xhr.responseText);
        likesCount.textContent = response.likesCount;
        likeBtn.style.color="red";
        likeBtn.innerHTML = `<i class="bi ${response.isLiked ? 'bi-heart-fill' : 'bi-heart'}"></i>`;
      } else {
        // Handle error
        console.error(xhr.statusText);
      }
    }
  };
  xhr.send();
}

function handleReadLaterButtonClick(blogId) {
  const readLaterBtn = document.getElementById('read-later-btn');

  // Send an AJAX request to the server to add/remove the blog from the user's read later list
  const xhr = new XMLHttpRequest();
  xhr.open('POST', `/home/${blogId}/readlater`);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        // Update the UI to reflect the updated button icon and label
        const response = JSON.parse(xhr.responseText);
        readLaterBtn.innerHTML = `<i class="bi ${response.isReadLater ? 'bi-bookmark-check-fill' : 'bi-bookmark'}"></i>`;
      } else {
        // Handle error
        console.error(xhr.statusText);
      }
    }
  };
  xhr.send();
}

function displayImage(input) {
  const selectedImage = document.getElementById('selectedImage');
  selectedImage.src = URL.createObjectURL(input.files[0]);
}

function generateTags() {
  const body = tinymce.get('body').getContent();
  
  // Create a new XMLHttpRequest object
  const xhr = new XMLHttpRequest();
  
  // Set the HTTP method, URL and content type
  xhr.open('POST', '/generateTags', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  
  // Define the callback function to be executed when the response is received
  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
      // Extract the keywords from the response and update the HTML
      const keywords = JSON.parse(xhr.responseText).keywords;
      document.getElementById("tttt").style.visibility = "visible";
      const myArray = keywords.split(",");
      console.log(myArray); 
      for (var i = 0; i < 3; i++) {
        console.log(myArray[i]);
        document.getElementsByClassName("tags")[i].innerHTML = myArray[i];
      }
    }
  };
  
  // Send the request with the body data as a JSON string
  xhr.send(JSON.stringify({ body: body }));

}



document.addEventListener('DOMContentLoaded', function() {
  // code to initialize TinyMCE editor
  tinymce.init({
    selector: '#body',
    height: 500,
    plugins: [
        'advlist autolink lists link image charmap print preview anchor',
        'searchreplace visualblocks code fullscreen',
        'insertdatetime media table paste code help wordcount'
    ],
    toolbar: 'undo redo | formatselect | ' +
        'bold italic backcolor | alignleft aligncenter ' +
        'alignright alignjustify | bullist numlist outdent indent | ' +
        'removeformat | help',
    menu: {
        favs: {title: 'My Favorites', items: 'code visualaid | searchreplace | emoticons'}
    },
    toolbar_mode: 'floating',
  tinycomments_mode: 'embedded',
  tinycomments_author: 'Author Name',
    content_css: [
        '//fonts.googleapis.com/css?family=Lato:300,300i,400,400i',
        '//www.tiny.cloud/css/codepen.min.css'
    ]
  });
});
