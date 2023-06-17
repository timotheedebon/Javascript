import * as R from 'ramda';
import csvToJson from 'csvtojson';
import fs from 'fs/promises';

const csvFilePath = 'Data_V2.csv';

const convertCsvToJson = async (path) => {
    try {
        const jsonArray = await csvToJson().fromFile(path);
        const jsonString = JSON.stringify(jsonArray, null, 2);
        await fs.writeFile('output.json', jsonString);
        return jsonArray;
    } catch (error) {
        console.error(error);
    }
};

const findMostRecentEntry = (data) => {
    const compareDates = (entry1, entry2) => new Date(entry2.date).getTime() - new Date(entry1.date).getTime();
    const sortByDateDescending = (list) => [...list].sort(compareDates);
    const [mostRecentEntry] = sortByDateDescending(data);
    return mostRecentEntry;
};

const findOldestEntry = (data) => {
    const compareDates = (entry1, entry2) => new Date(entry1.date).getTime() - new Date(entry2.date).getTime();
    const sortByDateAscending = (list) => [...list].sort(compareDates);
    const [oldestEntry] = sortByDateAscending(data);
    return oldestEntry;
};

const findLongestText = (data) => {
    const longestText = R.reduce(
        R.maxBy(R.compose(R.length, R.prop('text'))),
        { text: '' },
        data
    );
    return longestText.text;
};

const findUserWithMostEntries = (data) => {
    const entriesByUser = R.groupBy(R.prop('user'), data);
    const userEntries = R.mapObjIndexed((entries, user) => ({ user, count: entries.length }), entriesByUser);
    const userWithMostEntries = R.reduce(R.maxBy(R.prop('count')), { count: 0 }, Object.values(userEntries));

    return userWithMostEntries;
};

const countMentions = R.compose(R.length, R.split(/\s+/), R.prop('text'));

const calculateAverageDelay = (data) => {
    const tweetDates = data.map((entry) => new Date(entry.date));
    const delays = R.aperture(2, tweetDates).map(([date1, date2]) => date2 - date1);
    const totalDelay = R.sum(delays);
    const averageDelay = totalDelay / (delays.length || 1);
    return averageDelay;
};

const displayResults = R.curry((mostRecent, oldest, longestText, userWithMostEntries, mentionsCount) => {
    console.log(`\n\x1b[4mTweet de l'utilisateur le plus récent (${mostRecent.date}):\x1b[0m\n${mostRecent.text},@${mostRecent.user}`);
    console.log(`\n\x1b[4mTweet le plus ancien (${oldest.date}):\x1b[0m\n${oldest.text},@${oldest.user}`);
    console.log(`\n\x1b[4mTweet avec le plus grand nombre de caractères:\x1b[0m\n${longestText}`);
    console.log(`\n\x1b[4mUtilisateur avec le plus grand nombre de tweets:\x1b[0m\n${userWithMostEntries.user} (${userWithMostEntries.count} tweets)`);
    console.log(`\n\x1b[4mNombre de mentions:\x1b[0m\n${mentionsCount}`);
});

const handleError = (error) => {
    console.error(error);
    process.exit(1);
};

const main = async () => {
    try {
        const data = await convertCsvToJson(csvFilePath);
        const mostRecentEntry = findMostRecentEntry(data);
        const oldestEntry = findOldestEntry(data);
        const longestText = findLongestText(data);
        const userWithMostEntries = findUserWithMostEntries(data);
        const mentionsCount = countMentions(mostRecentEntry);
        const averageDelay = calculateAverageDelay(data);

        displayResults(mostRecentEntry, oldestEntry, longestText, userWithMostEntries, mentionsCount);
        console.log(`\n\x1b[4mMoyenne du délai entre les tweets:\x1b[0m ${averageDelay.toFixed(2)} ms`);
    } catch (error) {
        handleError(error);
    }
};

main();
