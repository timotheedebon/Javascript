import { compose, curry, groupBy, head, map, reduce, prop , mapObjIndexed, maxBy, length } from 'ramda';
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
    const longestText = reduce(
        maxBy(compose(length, prop('text'))),
        { text: '' },
        data
    );
    return longestText.text;
};

const findUserWithMostEntries = (data) => {
    const entriesByUser = groupBy(prop('user'), data);
    const userEntries = mapObjIndexed((entries, user) => ({ user, count: entries.length }), entriesByUser);
    const userWithMostEntries = reduce(maxBy(prop('count')), { count: 0 }, Object.values(userEntries));

    return userWithMostEntries;


};


const displayResults = curry((mostRecent, longestText, userWithMostEntries) => {
    console.log(`Tweet de l'utilisateur le plus recent (${mostRecent.date}): ${mostRecent.text},@${mostRecent.user}`);
    console.log(`Tweet avec le plus grand nombre de caractères: ${longestText}`);
    console.log(`Utilisateur avec le plus grand nombre de tweets: ${userWithMostEntries.user} (${userWithMostEntries.count} tweets)`);
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
        displayResults(mostRecentEntry, longestText, userWithMostEntries);

    } catch (error) {
        handleError(error);
    }
};

main();

