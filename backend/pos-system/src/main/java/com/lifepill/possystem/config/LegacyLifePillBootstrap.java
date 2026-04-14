package com.lifepill.possystem.config;

import com.lifepill.possystem.entity.Branch;
import com.lifepill.possystem.entity.Employer;
import com.lifepill.possystem.entity.enums.Gender;
import com.lifepill.possystem.entity.enums.Role;
import com.lifepill.possystem.repo.branchRepository.BranchRepository;
import com.lifepill.possystem.repo.employerRepository.EmployerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class LegacyLifePillBootstrap implements CommandLineRunner {

    private final BranchRepository branchRepository;
    private final EmployerRepository employerRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        List<Branch> existingBranches = branchRepository.findAll();
        Branch headOffice = existingBranches.isEmpty()
                ? branchRepository.save(
                        Branch.builder()
                                .branchName("Head Office")
                                .branchAddress("LifePill Building, 123 Main Street, Colombo 03")
                                .branchContact("0112345678")
                                .branchEmail("headoffice@lifepill.com")
                                .branchDescription("Legacy LifePill head office demo branch")
                                .branchStatus(true)
                                .branchLocation("6.9271,79.8612")
                                .branchCreatedOn(LocalDate.now().toString())
                                .branchCreatedBy("bootstrap")
                                .build()
                )
                : existingBranches.get(0);

        Branch cashierBranch;
        if (existingBranches.size() > 1) {
            cashierBranch = existingBranches.get(1);
        } else {
            cashierBranch = branchRepository.save(
                    Branch.builder()
                            .branchName("Maradana Branch")
                            .branchAddress("456 Maradana Road, Colombo 10")
                            .branchContact("0119876543")
                            .branchEmail("maradana@lifepill.com")
                            .branchDescription("Legacy LifePill cashier demo branch")
                            .branchStatus(true)
                            .branchLocation("6.9147,79.8646")
                            .branchCreatedOn(LocalDate.now().toString())
                            .branchCreatedBy("bootstrap")
                            .build()
            );
        }

        seedEmployer(
                "admin@lifepill.com",
                "admin123",
                1234,
                Role.OWNER,
                headOffice,
                "Pramitha",
                "Jayasooriya",
                "pramitha",
                "0771234567",
                "LifePill Head Office, 123 Main Street, Colombo 03",
                "200012345678",
                150000
        );

        seedEmployer(
                "cashier1@lifepill.com",
                "password123",
                4321,
                Role.CASHIER,
                cashierBranch,
                "Jane",
                "Doe",
                "jane",
                "0774445555",
                "Maradana Branch, Colombo 10",
                "199544556677",
                45000
        );
    }

    private void seedEmployer(
            String email,
            String password,
            int pin,
            Role role,
            Branch branch,
            String firstName,
            String lastName,
            String nickName,
            String phone,
            String address,
            String nic,
            double salary
    ) {
        employerRepository.findByEmployerEmail(email).orElseGet(() ->
                employerRepository.save(
                        Employer.builder()
                                .employerNicName(nickName)
                                .employerFirstName(firstName)
                                .employerLastName(lastName)
                                .employerPassword(passwordEncoder.encode(password))
                                .employerEmail(email)
                                .employerPhone(phone)
                                .employerAddress(address)
                                .employerSalary(salary)
                                .employerNic(nic)
                                .isActiveStatus(true)
                                .pin(pin)
                                .gender(Gender.MALE)
                                .dateOfBirth(Date.valueOf(LocalDate.of(1990, 1, 15)))
                                .role(role)
                                .branch(branch)
                                .build()
                ));
    }
}
