# Calendar widget 
Renders a calendar showing issue with Due Dates set to some particular date.
It is possible to configure query for the issues that will be shown 
Works in YouTrack 2018.1+, Hub 2018.1+, Upsource 2018.1+.
![](./widget.png) 

# Development

1. NodeJS and NPM are required
2. Run `npm install` in the project folder to install dependencies
3. Run `npm start` in the project folder to run development http server
4. Open widgets playground (/dashboard/widgets-playground) and enter your development server address.
5. To build dist user `npm run-script build`

# Packing

1. After running `npm run-script build` archive all content of dist as ZIP file and it is ready to upload to Hub

# License

The code of this widget is licensed with Apache 2.0.

