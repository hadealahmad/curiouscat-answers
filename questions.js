         document.addEventListener("DOMContentLoaded", () => {
             async function main(token) {
                 if (!token) {
                     alert("يرجى إدخال رمز الوصول.");
                     return;
                 }

                 try {
                     const posts = await getAllPostsFromUser(token);
                     return posts; // Return posts for further use
                 } catch (error) {
                     console.error("Error fetching posts:", error);
                     alert("Error fetching posts. Check console for details.");
                 }
             }

             async function getAllPostsFromUser(token) {
                 let posts = [];
                 let lastTimestamp = 0;

                 while (true) {
                     const res = await getPosts(token, lastTimestamp);
                     if (!res.posts || res.posts.length === 0) {
                         break; // Exit the loop if no posts are returned
                     }

                     // Concatenate new posts to the array
                     posts = posts.concat(res.posts);

                     // Update lastTimestamp to the last post's timestamp minus 1 for the next request
                     lastTimestamp = res.posts[res.posts.length - 1].timestamp - 1; // Access timestamp directly from the post
                 }

                 return posts;
             }

             async function getPosts(token, timestamp = 0) {
                 const url = `https://curiouscat.live/api/v2/inbox?_ob=noregisterOrSignin2&${timestamp !== 0 ? `&max_timestamp=${timestamp}` : ""}`;
                 try {
                     const response = await fetch(url, {
                         headers: {
                             Authorization: `Basic ${token}`,
                         },
                     });
                     const data = await response.json();
                     return data;
                 } catch (err) {
                     console.error("Error fetching data:", err);
                     throw err;
                 }
             }

             function saveAsJSON(posts) {
                 const jsonOutput = posts.map(post => ({
                     id: post.id,
                     timestamp: post.timestamp,
                     comment: post.comment || '',
                     media: post.media || null
                 }));

                 const blob = new Blob([JSON.stringify(jsonOutput, null, 2)], { type: "application/json" });
                 const link = document.createElement("a");
                 link.href = URL.createObjectURL(blob);
                 link.download = `posts.json`;
                 link.click();
                 URL.revokeObjectURL(link.href);
                 hideLoader(); // Hide loader after download
             }

             function saveAsHTML(posts) {
                 const htmlContent = `
                 <!DOCTYPE html>
                 <html lang="ar" dir="rtl">
                 <head>
                 <meta charset="UTF-8">
                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
                 <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                 <title>أرشيف كيوريس كات</title>
                 <style>
                 .hidden { display: none; }
                 *{ font-family: "IBM Plex Sans Arabic", sans-serif; }
                 </style>
                 </head>
                 <body class="text-gray-50" style="background:#0E182D;">
                 <nav class="flex p-2 mb-2.5">
                 <div class="flex flex-1 justify-start">
                 <span class="text-xl font-extrabold">أرشيف أسئلة حسابك على كيوريس كات</span>
                 </div>
                 <div class="flex flex-1 justify-end">
                 <span class="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-black ring-1 ring-inset ring-gray-500">${posts.length} أسئلة</span>
                 </div>
                 </nav>
                 <div class="flex flex-1 justify-center my-5">
                 <span class="px-6 py-3 rounded-md border" style="background:#466DC2;"><a href="https://hadealahmad.com/cc-backup">حمّل أرشيف حسابك</a></span>
                 </div>

                 <div class="my-2.5">
                 <div class="container flex flex-col justify-center mx-auto">

                 <label for="search">ابحث عن رسالة...</label>
                 <input type="text" id="search" class="my-2.5 rounded-md text-black border p-2 mb-4 w-full" placeholder="" oninput="filterMessages()">
                 </div>
                 <div class="container flex flex-col justify-center mx-auto">
                 <div id="messagesList" class="list-disc">
                 ${posts.map(post => `
                     <div class="message-item my-2.5 py-1.5 rounded-md" style="background:#18284D;">
                     <div class="items-center justify-between px-4 py-3 m-2.5 rounded-md" style="background:#0E182D;">
                     <span class="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-black ring-1 ring-inset ring-gray-500">${new Date(post.timestamp * 1000).toLocaleString()}</span>
                     <br>${post.comment || ''}
                     </div>
                     </div>
                     `).join('')}
                     </div>
                     </div>
                     <script>
                     function filterMessages() {
                         const searchTerm = document.getElementById('search').value.toLowerCase();
                         const messages = document.querySelectorAll('.message-item');
                         messages.forEach(message => {
                             const messageText = message.innerText.toLowerCase();
                             message.classList.toggle('hidden', !messageText.includes(searchTerm));
                         });
                     }
                     </script>
                     </div>
                     </body>
                     </html>`;

                     const blob = new Blob([htmlContent], { type: "text/html" });
                     const link = document.createElement("a");
                     link.href = URL.createObjectURL(blob);
                     link.download = `posts.html`;
                     link.click();
                     URL.revokeObjectURL(link.href);
                     hideLoader(); // Hide loader after download
             }

             function showLoader() {
                 document.getElementById("loader").classList.remove("hidden");
                 document.getElementById("loadingMessage").classList.remove("hidden");
             }

             function hideLoader() {
                 document.getElementById("loader").classList.add("hidden");
                 document.getElementById("loadingMessage").classList.add("hidden");
             }

             document.getElementById("downloadJson").addEventListener("click", async () => {
                 const token = document.getElementById("token").value.trim();
                 showLoader(); // Show loader before fetching posts
                 const posts = await main(token);
                 if (posts) saveAsJSON(posts);
             });

                 document.getElementById("downloadHtml").addEventListener("click", async () => {
                     const token = document.getElementById("token").value.trim();
                     showLoader(); // Show loader before fetching posts
                     const posts = await main(token);
                     if (posts) saveAsHTML(posts);
                 });
         });
