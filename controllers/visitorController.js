const supabase = require('../services/supabaseClient');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate 8-char alphanumeric token
function generateShortToken() {
  return crypto.randomBytes(4).toString('hex').slice(0, 8).toUpperCase();
}

exports.createVisitor = async (req, res) => {
  console.log("Request Body:", req.body);

  let {
    name, email, phone, photo_url, invite_token,
    invited_by, whom_to_meet, type, purpose,
    expected_visit_time, department, location,
    floor_no, gate_entry, create_credentials, status,
    
  } = req.body;

  // 1. Generate invite token
  if (!invite_token || invite_token.trim() === '') {
    invite_token = generateShortToken();
  }

  // 2. Upload visitor photo if provided
  if (req.file) {
    try {
      const photoBuffer = req.file.buffer;
      const photoFileName = `visitor_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;

      const { error: photoUploadError } = await supabase
        .storage
        .from('visitor-photo')
        .upload(photoFileName, photoBuffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (photoUploadError) {
        console.error('Visitor Photo Upload Error:', photoUploadError);
      } else {
        const { data: photoUrlData } = supabase
          .storage
          .from('visitor-photo')
          .getPublicUrl(photoFileName);

        photo_url = photoUrlData.publicUrl;
      }
    } catch (err) {
      console.error('Photo processing failed:', err);
    }
  }

  // 3. Generate QR code
  let qrCodeImage;
  try {
    qrCodeImage = await QRCode.toDataURL(invite_token, {
      width: 200,
      margin: 1
    });
  } catch (qrError) {
    console.error('QR Code Generation Error:', qrError);
    return res.status(500).json({ error: 'Failed to generate QR code' });
  }

  // 4. Convert base64 to buffer and upload to Supabase Storage
  const base64Data = qrCodeImage.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const fileName = `qr_${invite_token}.png`;

  const { error: uploadError } = await supabase
    .storage
    .from('visitor-qrcodes')
    .upload(fileName, buffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (uploadError) {
    console.error('QR Upload Error:', uploadError);
    return res.status(500).json({ error: 'Failed to upload QR code to storage' });
  }

  // 5. Get public URL
  const { data: publicUrlData } = supabase
    .storage
    .from('visitor-qrcodes')
    .getPublicUrl(fileName);

  const qrCodePublicUrl = publicUrlData.publicUrl;

  // 6. Insert visitor into Supabase
  const { data, error } = await supabase
    .from('visitors')
    .insert([{
      name, email, phone, photo_url, invite_token,
      invited_by, whom_to_meet, type, purpose,
      expected_visit_time, department, location,
      floor_no, gate_entry, create_credentials, status
    }])
    .select('*');

  if (error) {
    console.error("Supabase Insert Error:", error);
    return res.status(500).json({ error: error.message });
  }

  // 7. Send email with QR code image
  if (email) {
    try {
      const imgSrc = photo_url && photo_url.trim() !== ''
        ? photo_url
        : 'https://via.placeholder.com/100';

      await resend.emails.send({
        from: 'no-reply@theyuvai.com',
        to: email,
        subject: 'Your Visitor ID Card – EntryPoint',
        html: `
        <div style="font-family: Arial, sans-serif; background: #f6f6f6; padding: 20px;">
          <div style="max-width: 400px; margin: auto; background: white; border-radius: 12px; border: 2px solid #007bff; padding: 20px; text-align: center;">
            <h2 style="color: #007bff; margin-bottom: 10px;">EntryPoint Visitor Pass</h2>
            
            <img src="${imgSrc}" alt="Visitor Photo" style="width: 100px; height: 100px; border-radius: 50%; border: 2px solid #ccc; object-fit: cover; margin-bottom: 15px;" />

            <h3 style="margin: 5px 0;">${name}</h3>
            <p style="margin: 5px 0; font-size: 14px; color: #666;"><strong>Purpose:</strong> ${purpose || 'N/A'}</p>
            <p style="font-size: 14px; color: #444; margin: 8px 0;"><strong>Invite Token:</strong></p>
            <div style="background-color: #eee; padding: 10px; font-size: 18px; font-weight: bold; border-radius: 6px; letter-spacing: 2px;">
              ${invite_token}
            </div>

            <div style="margin-top: 20px;">
              <img src="${qrCodePublicUrl}" alt="QR Code" width="180" height="180" />
              <p style="font-size: 12px; color: #777; margin-top: 10px;">Show this code to security at the gate.</p>
            </div>

            

            <hr style="margin: 20px 0;" />
            <p style="font-size: 13px; color: #999;">EntryPoint Visitor Management System</p>
          </div>
        </div>
        `
      });

      console.log(`✅ Email sent to ${email} with QR`);
    } catch (mailError) {
      console.error('Email send failed:', mailError);
    }
  }

  // 8. Final response
  res.status(201).json({
    message: 'Visitor created successfully',
    data,
    qr_url: qrCodePublicUrl
  });
};
