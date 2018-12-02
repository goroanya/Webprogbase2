
$("#albumDeleteButton").click(function () {
    $("#deleteModal").modal();
});


$('#albumDeleteButton').click(function () {
    let albumName = $('#album').val();
    deleteConfirm(albumName);
});

function deleteConfirm(albumName) {

    let modal = $("#deleteModal");
    modal.modal('show');

    $('#confirmDeleteButton').bind('click', async function () {

        await fetch(`/api/v1/albums/${albumName}`, { method: "DELETE" });
        $("deleteForm").submit();

    });
};