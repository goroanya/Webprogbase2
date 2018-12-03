
$('#albumDeleteButton').click(function () {
    deleteConfirm();
});

function deleteConfirm() {

    let modal = $("#deleteModal");
    modal.modal('show');

    $('#confirmDeleteButton').bind('click', async function () {

        let albumName = $('#album').text();
        let result = await fetch(`/api/v1/albums/${albumName}`, { method: "DELETE" });
        result = await result.json();
        $("deleteForm").submit();

    });
};

