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



const displayResults = R.curry((mostRecent, longestText, userWithMostEntries, mentionsCount) => {
    console.log(`Tweet de l'utilisateur le plus récent (${mostRecent.date}): ${mostRecent.text},@${mostRecent.user}`);
    console.log(`Tweet avec le plus grand nombre de caractères: ${longestText}`);
    console.log(`Utilisateur avec le plus grand nombre de tweets: ${userWithMostEntries.user} (${userWithMostEntries.count} tweets)`);
    console.log(`Nombre de mentions: ${mentionsCount}`);
});

const handleError = (error) => {
    console.error(error);
    process.exit(1);
};

const main = async () => {
    try {
        const data = await convertCsvToJson(csvFilePath);
        const mostRecentEntry = findMostRecentEntry(data);
        const longestText = findLongestText(data);
        const userWithMostEntries = findUserWithMostEntries(data);
        const mentionsCount = countMentions(mostRecentEntry); // Compte les mentions dans le tweet le plus récent
        displayResults(mostRecentEntry, longestText, userWithMostEntries, mentionsCount);

    } catch (error) {
        handleError(error);
    }
};

main();
