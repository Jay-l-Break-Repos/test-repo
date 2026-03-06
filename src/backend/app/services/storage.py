import os
import tempfile
import shutil

def save_upload_file(file):
    """Save an uploaded file to a temporary location and return the path."""
    upload_dir = os.path.join(tempfile.gettempdir(), "docuserve_uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    temp_file = tempfile.NamedTemporaryFile(delete=False, dir=upload_dir)
    try:
        shutil.copyfileobj(file.file, temp_file)
    finally:
        temp_file.close()
        file.file.close()
    
    return temp_file.name