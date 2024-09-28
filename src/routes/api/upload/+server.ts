// src/routes/upload/+server.js
import { DBupsertFile } from '$lib/db/utils';
import { json } from '@sveltejs/kit';

type uploadData = {
    file: File;
    preview?: File;
    id?: string;
    filename: string;
}


export async function POST({ request, locals: { dbUser } }) {
    if (!dbUser) return json({ error: 'Unauthorized' }, { status: 401 });
    const data = await request.formData();

    const ud: uploadData = {
        file: data.get('file') as File,
        preview: data.get('preview') as File||undefined,
        filename: data.get('filename') as string,
        id: data.get('id') as string||undefined,
    }

    if (!ud.file) return json({ error: 'No file uploaded' }, { status: 400 });
    if (!ud.filename) return json({ error: 'No filename provided' }, { status: 400 });


    const newFile: FileInterface = {
        id: ud.id,
        userID: dbUser.id,
        fileName: ud.filename,
        mimeType: ud.file.type,
        size: ud.file.size,
        hasPreview: !!ud.preview,
        previewSize: ud.preview?.size,
        previewMimeType: ud.preview?.type,
    }

    const insertedFile = await DBupsertFile({ dbUser,  file: newFile });
    console.log(insertedFile);

    return json(insertedFile);



    // if (!file) {
    //     return json({ error: 'No file uploaded' }, { status: 400 });
    // }

    // // Process the file (e.g., save it)
    // const fileName = `uploads/${file.name}`;
    // await fs.writeFile(fileName, Buffer.from(await file.arrayBuffer()));

    // Perform any additional processing or analysis here

    // Return data back to the client
    // return json({
    //     success: true,
    //     fileName: fileName,
    //     size: file.size,
    //     type: file.type,
    //     // Add any other relevant data here
    // });
}