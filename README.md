# App_Design_Share
An interactive web application that allows designers to post their works by uploading images, receive comments, ratings and likes.

Live Demo:
To see the app in action, [Heroku Link](https://design-share.herokuapp.com)
# Features

- **Authentication:**
  - User login with username and password
  - Admin sign-up with admin code

- **Authorization:**
  - One cannot manage posts and view user profile without being authenticated
  - One cannot edit or delete posts and comments created by other users
  - Admin can manage all posts and comments

- **Manage design posts with basic functionalities:**
  - Create, edit and delete posts and comments
  - Rate, like and review posts
  - Upload design photos
  - Search existing posts
  - Sort and filter posts according to categories and rating scores

- **Flash messages responding to users' interaction with the app**
- **Responsive web design**
- **Custom Enhancements**

# Getting Started
```
    This app contains API secrets and passwords that have been hidden deliberately, so the app cannot be run with its features on your local machine. However, feel free to clone this repository if necessary.
```
Clone or download this repository
```
git clone https://github.com/Chongliang-Utopia/App_Design_Share.git
```

Install dependencies
```
    npm install
```
or
```
    yarn install
```   
# Built with
- **Front-end**
  - ejs
  - Bootstrap
  - Google Maps APIs

- **Back-end**
  - express
  - mongoDB
  - mongoose
  - passport
  - passport-local
  - method-override
  - geocoder
  - connect-flash

# Platforms
- Heroku
- Goormide

