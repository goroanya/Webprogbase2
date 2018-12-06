
$('#albumDeleteButton').click(function () {
    deleteConfirm();
});

function deleteConfirm() {

    let modal = $("#deleteModal");
    modal.modal('show');

    $('#confirmDeleteButton').bind('click', async function () {

        let albumId = $('#albumId').val();
        
        await fetch(`/api/v1/albums/${albumId}`, { method: "DELETE" });
        $("deleteForm").submit();

    });
};

