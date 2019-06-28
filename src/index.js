import * as Slack from 'slack-node';
import { Promise as BluePromise } from 'bluebird';
// import { webHookUri, channelName } from './slack-settings';
const nconf = module.parent.require('nconf');
const webHookUri = nconf.get('slackWebUrl') || '';
const channelName = nconf.get('channelName');
const contentLen = nconf.get('postContentLength') || 200;
const user = module.parent.require('./user');
const topics = module.parent.require('./topics');
const categories = module.parent.require('./categories');
export async function savePost(newPost) {
    const slackObj = new Slack();
    const uri = webHookUri;
    slackObj.setWebhook(uri);
    const post = newPost.post;
    const userPromise = new Promise((resolve, reject) => {
        user.getUserFields(post.uid, ['username', 'picture'], (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
    const topicPromise = new Promise((resolve, reject) => {
        topics.getTopicFields(post.tid, ['title', 'slug'], (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
    const catPromise = new Promise((resolve, reject) => {
        categories.getCategoryFields(post.cid, ['name'], (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
    const [userResult, topicResult, catResult] = await BluePromise.all([
        userPromise,
        topicPromise,
        catPromise,
    ]);
    // tslint:disable-next-line
    // console.log(userResult, topicResult, catResult);
    const content = post.content.substring(0, contentLen) + '...';
    const message = '<' +
        nconf.get('url') +
        '/topic/' +
        topicResult.slug +
        '|[' +
        catResult.name +
        ': ' +
        topicResult.title +
        ']>\n' +
        '<' +
        nconf.get('url') +
        '/user/' +
        userResult.username +
        '|' +
        userResult.username +
        '>' +
        ': ' +
        content;
    // tslint:disable-next-line
    // console.log('message', message);
    slackObj.webhook({
        channel: channelName || '#general',
        username: userResult.username,
        text: message,
    }, (err, response) => {
        // tslint:disable-next-line
        //console.log(response);
        if (err) {
            // tslint:disable-next-line
            console.log('********error*********', err);
        }
    });
}
// savePost({ post: { content: 'vbvbvb' } });
