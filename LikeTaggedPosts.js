/* Initial parameters */
const username = ''; /* Enter Instagram username here */
const password = ''; /* Enter Instagram password here */
const profiles = ['', '']; /*Enter the name of the accounts you want to find tagged posts for, e.g. 'beyonce', 'apple', 'bradpitt', etc*/
const maximumLikesPerExecution = 200; // Define maximum amount of likes allowed every time the script runs

const usersLiked = [];
var likedPosts = 0;
var today = new Date();

const browserOptions = {
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36',
        '--lang=en-US,en;q=0.9']
};

// Shuffles the array
profiles.sort(function() { return .5 - Math.random(); });

// Creates log file
let logDate = today.toISOString();
var logFileName = 'Log LikeTaggedPosts ' + logDate.substr(8,2) + "-" + logDate.substr(5,2) + "-" + logDate.substr(2,2) + " " + logDate.substr(logDate.lastIndexOf("T")+1, 8).replace(/[":"]/g,"") + ".txt";
fs.writeFile(".\\Logs\\" + logFileName, '', function (err) { if (err) return console.log(err); });

(async () => {
    const browser = await puppeteer.launch(browserOptions); //await puppeteer.launch({ executablePath:'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', headless:false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1060, height: 500 });

    /* Block of code required to pass detection tests */   
    await page.evaluateOnNewDocument(() => {
        window.navigator.chrome = { runtime: {} };

        Object.defineProperty(window, 'chrome', {
            get: () => true,
        });

        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
          });

        const originalQuery = window.navigator.permissions.query;
        return window.navigator.permissions.query = (parameters) => ( parameters.name === 'notifications' ? Promise.resolve({ state: Notification.permission }) : originalQuery(parameters) );
    });

    try {
        function delay(time) {
            return new Promise(function(resolve) { 
                setTimeout(resolve, time + Math.floor(Math.random() * 2500))
            });
         }

         function log(whatever) {
            whatever = new Date().toTimeString().substring(0,8) + " - " + whatever;
            fs.appendFile(".\\Logs\\" + logFileName, whatever + "\r\n", function (err) { if (err) throw err; });
            console.log(whatever);
         }

        /********* AUTHENTICATION *********/
        // Loads page
        await page.goto("https://www.instagram.com/", { waitUntil:'load',timeout:0 });
        await page.waitForSelector('input[name="username"]');
        log("Starting authentication");

        // Looks for the input fields and types credentials
        const usernameInput = await page.$('input[name="username"]');
        const passwordInput = await page.$('input[name="password"]');
        await usernameInput.type(username, { delay: 100 });
        await passwordInput.type(password, { delay: 100 });

        // Looks for Log In button and clicks on it
        const loginButton = await page.$("button[type='submit']");
        await loginButton.click();
        log("Completed authentication");
        await delay(4000);

        // If prompted to save login info and turn on notifications, click Not now
        const buttonsLoginInfo = await page.$$("button");
        if (buttonsLoginInfo) {
            var buttonsLoginInfoText = await buttonsLoginInfo[1].evaluate(node => node.innerText);
            if(await buttonsLoginInfoText == "Not Now") { await buttonsLoginInfo[1].click(); }
            await delay(4000);
        }

        const buttonsNotifications = await page.$("button.aOOlW.HoLwm");
        if(buttonsNotifications) {
            var buttonsNotificationsText = await buttonsNotifications.evaluate(node => node.innerText);
            if(await buttonsNotificationsText == "Not Now") { await buttonsNotifications.click(); }
            await delay(4000);
        }

        /********* LIKE TAGGED POSTS *********/
        for (let i = 0; i < profiles.length; i++) {
            await page.goto(`https://www.instagram.com/${profiles[i]}/tagged/`, { waitUntil:'load',timeout:0 });
            log("Navigating to list of posts with @" + profiles[i] + " tagged");
            await delay(5000);

            if(likedPosts >= maximumLikesPerExecution) { log('Maximum amount of likes per execution has been reached.'); break; }

            for (let r = 1; r < 13; r++) { // Loops through each row

                if(likedPosts >= maximumLikesPerExecution) { log('Maximum amount of likes per execution has been reached.'); break; }

                for (let c = 1; c < 4; c++) { // Loops through each item in the row

                    // Opens the post
                    await page.waitFor(`article > div > div > .Nnq7C:nth-child(${r}) > .v1Nh3:nth-child(${c}) > a`);
                    let post = await page.$(`article > div > div > .Nnq7C:nth-child(${r}) > .v1Nh3:nth-child(${c}) > a`);
                    await post.click();
                    log("Opened post " + c + " of row " + r);
                    await delay(5000);

                    // Gets user
                    await page.waitFor("article.M9sTE > header > div:nth-child(2) > div > div > span > a");
                    let profileLink = await page.$("article.M9sTE > header > div:nth-child(2) > div > div > span > a");
                    let profileUsername = await profileLink.evaluate(node => node.innerText);

                    // Gets status of the like button (Like or Unlike)
                    await page.waitFor("article.M9sTE > div > section > span > button > div > span > svg");
                    let heartButton = await page.$("article.M9sTE > div > section > span > button > div > span > svg");
                    let heartButtonStatus = await heartButton.evaluate(node => node.ariaLabel);

                    // Gets amount of likes in the post
                    let videoViewCounter = await page.$("article > div > section:nth-child(2) > div > span > span");
                    let photoLikeCounter = await page.$("article > div > section:nth-child(2) > div > div > button > span");
                    let likeIt = 'yes';

                    // Gets post time
                    let postTimeSelector = await page.$("article > div.eo2As > div.k_Q0X.NnvRN > a > time");
                    let postTime = await postTimeSelector.evaluate(node => node.dateTime);
                    let postDate = new Date(await postTime);
                    let dateDiff = Math.round((today - postDate) / (1000 * 60 * 60 * 24));

                    // Ensures that photos have no more than 300 likes and videos have no more than 1000 views
                    if(videoViewCounter) {
                        let videoViews = await videoViewCounter.evaluate(node => node.innerText);
                        if(videoViews) { if(parseInt(videoViews) > 1000) { likeIt = 'no'; } }
                    } else if(photoLikeCounter) {
                        let photoLikes = await photoLikeCounter.evaluate(node => node.innerText);
                        if(photoLikes) { if(parseInt(photoLikes) > 300) { likeIt = 'no'; } }
                    }

                    if(dateDiff < 2) { // Ensures that post is not older than 2 days ago
                        if(profileUsername != username) { // Ensures that post is not from own profile
                            if(likeIt != 'no') { // Checks parameter defined above
                                if(await heartButtonStatus == "Like") { // Ensures that post is not already liked
                                    if(!(usersLiked.find(function (element) { return element == profileUsername; }))) { // Ensures that user has not had a post of theirs liked in this execution
                                        
                                        // Likes post if all conditions are met
                                        await heartButton.click(); log("Liked post");
                                        likedPosts += 1;

                                        // Adds user to the array of users who received a like
                                        usersLiked.push(profileUsername);

                                    } else { log("Not liked because another post from this user was recently liked."); }
                                } else { log("Not liked because post was already liked."); }
                            } else { log("Not liked because post has too many likes/views."); }
                        } else { log("Not liked because post is from your own profile."); }
                    } else { log("Not liked because post is older than 2 days ago."); }

                    await delay(3000);

                    // Closes the post
                    await page.click("body > div._2dDPU.CkGkG > div.Igw0E.IwRSH.eGOV_._4EzTm.BI4qX.qJPeX.fm1AK.TxciK.yiMZG > button");
                    log("Closed post " + c + " of row " + r);
                    await delay(5000);
                }
            }
        }
        
        await log("Completed! Posts liked: " + likedPosts);
    } catch(err) {
        log(err.message);
        console.error(err.message);
    } finally {
        await browser.close();
    }
}) ();