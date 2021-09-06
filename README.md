# Instagram Automation

Node.js scripts developed with Puppeteer library for searching and liking Instagram posts based on hashtags and account names.

Please note that these should be used as a reference and/or for learning purposes since automating user activity is forbidden by Instagram's terms of use.

The scripts available are:

1. LikePostByHashtag: based on the hashtags configured, the script looks for posts containing those hashtags and automatically likes them.
2. LikeTaggedPosts: based on the account names configured, the script looks for the account's tagged posts and likes them.

The scripts have some restrictions in place, such as: not liking your own posts; not liking posts of a same user more than once during the execution; not liking viral posts (over 1.000 likes), among others.
