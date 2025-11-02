<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

$conn = mysqli_connect("localhost", "root", "", "secureshare");

if (!$conn) {
    die(json_encode(['error' => 'Connection failed: ' . mysqli_connect_error()]));
}

$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    $fullName = mysqli_real_escape_string($conn, $data['fullName']);
    $email = mysqli_real_escape_string($conn, $data['email']);
    $role = mysqli_real_escape_string($conn, $data['role']);
    $password = password_hash($data['password'], PASSWORD_DEFAULT);

    $sql = "INSERT INTO users (full_name, email, role, password) VALUES (?, ?, ?, ?)";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "ssss", $fullName, $email, $role, $password);

    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Registration failed: ' . mysqli_error($conn)]);
    }
}

mysqli_close($conn);
?>
