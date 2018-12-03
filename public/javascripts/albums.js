async function renderAlbums() {
    try {

        let itemsData = await fetch("/api/v1/albums?page=" + localStorage.page);
        itemsData = await itemsData.json();

        let templateStr = await fetch("/templates/albums.mst");
        templateStr = await templateStr.text();

        const htmlStr = await Mustache.render(String(templateStr), itemsData);
        const albumsEl = document.getElementById('albums');
        albumsEl.innerHTML = htmlStr;
    }
    catch (err) {
        console.error(err);
    }
}


async function goToPage(page) {
    localStorage.page = parseInt(page);
    await renderAlbums();
}
window.onload = async function () {
    localStorage.page = 1;
    await renderAlbums();
};



