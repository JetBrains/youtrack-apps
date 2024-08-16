---
to: src/widgets/<%= folderName %>/index.html
---
<!doctype html>
<html>
    <head>
        <link rel="stylesheet" href="./main.css">
    </head>
    <body class="plugin" style="padding: 0; overflow: hidden;">
        <img src="logo.jpeg" style="width: 100%; height: 100%; object-fit: cover;"/>
        <script type="module">
            const host = await YTApp.register();
        </script>
    </body>
</html>