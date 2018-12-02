module.exports = function (entitiesLen, currentPage, entitiesPerPage) {
    const pageCount = Math.ceil(entitiesLen / entitiesPerPage);

    let pageCounterArray = [];
    for (let i = 1; i <= pageCount; i++) {
        if (i === currentPage) {
            pageCounterArray.push({ page: i, current: true });
        }
        else pageCounterArray.push({ page: i });
    }

    return {
        currentPage,
        pageCounterArray,
        prev: currentPage === 1 ? null : currentPage - 1,
        next: currentPage === pageCount ? null : currentPage + 1,
    };
};