async function fetchProfileData(username) {
    const apiUrl = `https://curiouscat.me/api/v2/profile?username=${username}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("خطأ:", error);
        return { error: "فشل سحب البيانات" };
    }
}

async function fetchMessages(username, totalAnswers) {
    let messages = [];
    let lastTimestamp = 0;

    while (messages.length < totalAnswers) {
        const apiUrl = `https://curiouscat.me/api/v2/profile?username=${username}&count=100${lastTimestamp ? `&max_timestamp=${lastTimestamp}` : ''}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.posts && data.posts.length) {
            data.posts.forEach(post => {
                messages.push({
                    timestamp: new Date(post.timestamp * 1000).toISOString(),
                              message: post.comment,
                              reply: post.reply
                });
            });
            lastTimestamp = data.posts[data.posts.length - 1].timestamp - 1;
        } else {
            break;
        }
    }

    return messages;
}

function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 4)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function downloadHtml(filename, data) {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <title>${data.username} - أرشيف كيوريس كات</title>
    <style>
    .hidden { display: none; }
    </style>
    </head>
    <body class="flex justify-center p-4 bg-gray-100 container">
    <div class="w-1/2 justify-self-center">
    <h1 class="text-2xl font-bold mb-4 text-center">${data.username}</h1>
    <p class="text-center">عدد الإجابات: ${data.answers}</p>
    <h2 class="mt-4 mb-2 text-center">الرسائل:</h2>
    <input type="text" id="search" class="rounded-md border p-2 mb-4 w-full" placeholder="ابحث عن رسالة..." oninput="filterMessages()">
    <div id="messagesList" class="list-disc">
    ${data.messages.map(msg => `
        <span class="message-item mb-2.5">
        <div class="rounded-md bg-blue-100 my-2.5 p-5 mr-5"><strong>تاريخ السؤال: ${msg.timestamp}</strong> <br> ${msg.message}</div>
        <div class="rounded-md bg-green-100 my-2.5 p-5 ml-5">${msg.reply ? `<strong>الرد:</strong><br> ${msg.reply}` : ''}</div>
        </span>
        <div class="border border-black w-2/4 justify-self-center"></div>
        `).join('')}
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
        </html>
        `;
        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('fetchData').addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        if (!username) {
            document.getElementById('status').innerText = "يرجى إدخال اسم مستخدم صالح.";
            return;
        }

        document.getElementById('status').innerText = "جار سحب البيانات...";

        const profileData = await fetchProfileData(username);

        if (profileData.error) {
            document.getElementById('status').innerText = "لم يتم العثور على المستخدم!";
            return;
        }

        const totalAnswers = profileData.answers || 0;
        if (!totalAnswers) {
            document.getElementById('status').innerText = "لم يتم العثور على أيّ أسئلة.";
            return;
        }

        document.getElementById('status').innerText = `جار سحب ${totalAnswers} سؤال...`;

        const messages = await fetchMessages(username, totalAnswers);

        const resultData = {
            username: profileData.username,
            answers: totalAnswers,
            followers: profileData.followers,
            following: profileData.following,
            twitter: `https://twitter.com/intent/user?user_id=${profileData.userData?.twitterid || ''}`,
            messages: messages.length ? messages : '[No Messages]'
        };

        downloadJson(`${username}_answers.json`, resultData);

        document.getElementById('status').innerText = "اكتمل التحميل، احفظ الملف.";
    });

    document.getElementById('fetchHtml').addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        if (!username) {
            document.getElementById('status').innerText = "يرجى إدخال اسم مستخدم صالح.";
            return;
        }

        document.getElementById('status').innerText = "جار سحب البيانات...";

        const profileData = await fetchProfileData(username);

        if (profileData.error) {
            document.getElementById('status').innerText = "لم يتم العثور على المستخدم!";
            return;
        }

        const totalAnswers = profileData.answers || 0;
        if (!totalAnswers) {
            document.getElementById('status').innerText = "لم يتم العثور على أيّ أسئلة.";
            return;
        }

        document.getElementById('status').innerText = `جاري سحب ${totalAnswers} سؤال...`;

        const messages = await fetchMessages(username, totalAnswers);

        const resultData = {
            username: profileData.username,
            answers: totalAnswers,
            followers: profileData.followers,
            following: profileData.following,
            messages: messages.length ? messages : '[No Messages]'
        };

        downloadHtml(`${username}_answers.html`, resultData);

        document.getElementById('status').innerText = "اكتمل التحميل، احفظ الملف.";
    });
});

