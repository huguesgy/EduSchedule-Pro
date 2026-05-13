<?php
// backend/utils/QRHelper.php

namespace Utils;

use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;

class QRHelper
{
    public static function generateToken($seance_id)
    {
        $secret = $_ENV['JWT_SECRET'] ?? 'qr_secret';
        $timestamp = time();
        return hash_hmac('sha256', $seance_id . $timestamp, $secret);
    }

    public static function generateImage($data)
    {
        $options = new QROptions([
            'version' => 5,
            'outputInterface' => \chillerlan\QRCode\Output\QRMarkupSVG::class,
            'eccLevel' => \chillerlan\QRCode\Common\EccLevel::L,
            'svgAddXmlHeader' => false,
            'svgUseFillAttributes' => true,
        ]);

        $qrcode = new QRCode($options);
        return $qrcode->render($data);
    }
}